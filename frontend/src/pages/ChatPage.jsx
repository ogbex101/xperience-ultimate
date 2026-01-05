import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Users, Search, Send, 
  Smile, Paperclip, Mic, Video,
  ChevronLeft, MoreVertical, Phone, Info,
  Check, CheckCheck, Circle, Wifi, WifiOff
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import chatAPI from '../utils/chatAPI';
import friendsAPI from '../utils/friendsAPI';
import './ChatPage.css';

const ChatPage = () => {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');
  const [conversations, setConversations] = useState([]);
  const [groupConversations, setGroupConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  
  const { socket, isConnected, onlineUsers, isUserOnline, sendTypingIndicator } = useSocket();
  const { user: currentUser } = useAuth();
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const lastTypingEmitRef = useRef(0);
  
  const socketRef = useRef(null);
  const selectedChatRef = useRef(null);
  const currentUserRef = useRef(null);

  // Update refs when values change
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // 1. Socket connection status
useEffect(() => {
  console.log('🔍 ChatPage: Socket status check', {
    socketAvailable: !!socket,
    isConnected,
    socketId: socket?.id,
    currentUserId: currentUser?.id,
    socketConnected: socket?.connected
  });

  // FIXED: Check both isConnected AND socket.connected
  const actuallyConnected = socket && (isConnected || socket.connected);
  
  if (socket && actuallyConnected && currentUser?.id) {
    console.log('✅ ChatPage: Socket is ready for use');
    setSocketReady(true);
  } else {
    setSocketReady(false);
  }
}, [socket, isConnected, currentUser]);

  // 2. Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('📥 ChatPage: Fetching initial data...');
        
        const [conversationsData, friendsData] = await Promise.all([
          chatAPI.getConversations(),
          friendsAPI.getFriends()
        ]);
        
        console.log('📥 Chat conversations:', conversationsData);
        console.log('📥 Friends data:', friendsData);
        
        const convs = conversationsData.conversations || [];
        const frnds = friendsData.friends || [];
        
        setConversations(convs);
        setFriends(frnds);
        
        // Initialize unread counts
        const unreadMap = {};
        convs.forEach(conv => {
          if (conv.other_user_id) {
            unreadMap[conv.other_user_id] = conv.unread_count || 0;
          }
        });
        setUnreadCounts(unreadMap);
        
        // Try to fetch groups
        try {
          const groupsData = await chatAPI.getGroupConversations();
          console.log('📥 Groups data:', groupsData);
          setGroupConversations(groupsData.groups || []);
        } catch (groupError) {
          console.warn('⚠️ ChatPage: Could not load group conversations:', groupError.message);
          setGroupConversations([]);
        }
        
        console.log('✅ ChatPage: Data loaded');
      } catch (error) {
        console.error('❌ ChatPage: Error loading data:', error);
        setConversations([]);
        setGroupConversations([]);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?.id) {
      fetchData();
    }
  }, [currentUser?.id]);

  // 3. Fetch chat history when selecting a chat
  const fetchChatHistory = useCallback(async (chat) => {
    if (!chat) return;
    
    try {
      console.log(`📜 ChatPage: Fetching history for ${chat.type}: ${chat.id}`);
      
      let historyData;
      if (chat.type === 'user') {
        historyData = await chatAPI.getChatHistory(chat.id);
        // Mark as read
        await chatAPI.markMessagesAsRead({ senderId: chat.id });
        // Clear unread count
        setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
        
        // Update conversation unread count
        setConversations(prev => prev.map(conv => 
          conv.other_user_id === chat.id 
            ? { ...conv, unread_count: 0 }
            : conv
        ));
      } else {
        historyData = await chatAPI.getGroupChatHistory(chat.id);
        await chatAPI.markMessagesAsRead({ groupId: chat.id });
      }
      
      const sortedMessages = (historyData.messages || []).sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      
      setMessages(sortedMessages);
      console.log(`✅ ChatPage: Loaded ${sortedMessages.length} messages`);
    } catch (error) {
      console.error('❌ ChatPage: Error fetching history:', error);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchChatHistory(selectedChat);
    }
  }, [selectedChat, fetchChatHistory]);

  // 4. Socket event listeners - COMPLETELY REWRITTEN
  useEffect(() => {
    if (!socket || !currentUser?.id) {
      console.log('⏳ ChatPage: Waiting for socket...');
      return;
    }

    console.log('👂 ChatPage: Setting up socket listeners');

    // ============ MESSAGE EVENTS ============
    const handleNewMessage = (data) => {
      console.log('📩 ChatPage: New message received:', data);
      
      const currentChat = selectedChatRef.current;
      const currentUser = currentUserRef.current;
      
      if (!data.sender_id || !currentUser) return;
      
      // Check if this message is for us
      if (data.receiver_id !== currentUser.id && data.sender_id !== currentUser.id) {
        return; // Not for us
      }
      
      const isForSelectedChat = currentChat && 
        currentChat.type === 'user' && 
        currentChat.id === data.sender_id;
      
      const isOwnMessage = data.sender_id === currentUser.id;
      
      // Create message object
      const newMsg = {
        id: data.id || `temp_${Date.now()}`,
        sender_id: data.sender_id,
        sender_username: data.sender_username || 'Unknown',
        sender_profile_pic: data.sender_profile_pic,
        message: data.message,
        created_at: data.created_at || new Date().toISOString(),
        read_status: isForSelectedChat ? 1 : 0,
        isOwn: isOwnMessage
      };
      
      // Add to messages if in the same chat OR if it's our own message
      if (isForSelectedChat || isOwnMessage) {
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(msg => msg.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        
        // Mark as read immediately if we're viewing the chat
        if (isForSelectedChat && !isOwnMessage && data.id && socket.connected) {
          socket.emit('message_read', { messageId: data.id });
        }
      }
      
      // Update conversations list for incoming messages only
      if (!isOwnMessage) {
        setConversations(prev => {
          let updated = [...prev];
          const convIndex = updated.findIndex(c => c.other_user_id === data.sender_id);
          
          if (convIndex >= 0) {
            // Update existing conversation
            updated[convIndex] = {
              ...updated[convIndex],
              last_message: data.message,
              last_message_time: data.created_at || new Date().toISOString(),
              unread_count: isForSelectedChat ? 0 : (updated[convIndex].unread_count || 0) + 1
            };
          } else {
            // Create new conversation
            updated.unshift({
              other_user_id: data.sender_id,
              other_user_username: data.sender_username,
              profile_pic: data.sender_profile_pic,
              last_message: data.message,
              last_message_time: data.created_at || new Date().toISOString(),
              unread_count: isForSelectedChat ? 0 : 1
            });
          }
          
          return updated.sort((a, b) => 
            new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)
          );
        });
        
        // Update unread counts
        if (!isForSelectedChat) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.sender_id]: (prev[data.sender_id] || 0) + 1
          }));
        }
      }
    };

    // ============ GROUP MESSAGE EVENTS ============
    const handleGroupMessage = (data) => {
      console.log('👥 ChatPage: New group message received:', data);
      
      const currentChat = selectedChatRef.current;
      
      if (currentChat && currentChat.type === 'group' && currentChat.id === data.groupId) {
        setMessages(prev => [...prev, {
          id: data.id || Date.now(),
          sender_id: data.senderId,
          sender_username: data.senderUsername,
          message: data.message,
          created_at: data.timestamp || new Date().toISOString()
        }]);
      }
      
      // Update group conversations
      setGroupConversations(prev => {
        const updated = [...prev];
        const groupIndex = updated.findIndex(g => g.group_id === data.groupId);
        
        if (groupIndex >= 0) {
          updated[groupIndex] = {
            ...updated[groupIndex],
            last_message: data.message,
            last_message_time: data.timestamp || new Date().toISOString()
          };
        }
        
        return updated.sort((a, b) => 
          new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)
        );
      });
    };

    // ============ TYPING INDICATOR ============
    const handleTyping = (data) => {
      console.log('⌨️ ChatPage: Typing indicator:', data);
      
      const currentChat = selectedChatRef.current;
      if (currentChat && currentChat.id === data.userId && currentChat.type === 'user') {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: data.isTyping
        }));
        
        // Auto-clear typing after 3 seconds
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [data.userId]: false
            }));
          }, 3000);
        }
      }
    };

    // ============ MESSAGE STATUS EVENTS ============
    const handleMessageSent = (data) => {
      console.log('✅ ChatPage: Message sent confirmation:', data);
      
      // Replace temporary message with real one
      if (data.tempId) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.tempId ? { 
            ...msg, 
            id: data.messageId, 
            sent: true,
            created_at: data.created_at || msg.created_at
          } : msg
        ));
      }
    };

    const handleMessageDelivered = (data) => {
      console.log('✓ ChatPage: Message delivered:', data);
      
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, delivered: true } : msg
      ));
    };

    const handleMessageRead = (data) => {
      console.log('✓✓ ChatPage: Message read:', data);
      
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, read_status: 1 } : msg
      ));
    };

    // ============ FRIEND STATUS EVENTS ============
    const handleFriendStatusChange = (data) => {
      console.log('👥 ChatPage: Friend status changed:', data);
      
      // Update online status in conversations
      setConversations(prev => prev.map(conv => 
        conv.other_user_id === data.userId 
          ? { ...conv, isOnline: data.isOnline }
          : conv
      ));
      
      // Update online status in friends
      setFriends(prev => prev.map(friend =>
        friend.id === data.userId 
          ? { ...friend, status: data.isOnline ? 'online' : 'offline' }
          : friend
      ));
    };

    // ============ ONLINE USERS LIST ============
    const handleOnlineUsers = (data) => {
      console.log('👥 ChatPage: Online users list:', data);
      // This updates automatically through SocketContext
    };

    // ============ ATTACH ALL LISTENERS ============
    socket.on('new_message', handleNewMessage);
    socket.on('group_message_received', handleGroupMessage);
    socket.on('user_typing', handleTyping);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    socket.on('friend_status_change', handleFriendStatusChange);
    socket.on('online_users_list', handleOnlineUsers);
    
    // Connection events
    socket.on('connect', () => {
      console.log('✅ ChatPage: Socket connected');
      setSocketReady(true);
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 ChatPage: Socket disconnected');
      setSocketReady(false);
    });

    // ============ CLEANUP ============
    return () => {
      console.log('🧹 ChatPage: Removing socket listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('group_message_received', handleGroupMessage);
      socket.off('user_typing', handleTyping);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.off('friend_status_change', handleFriendStatusChange);
      socket.off('online_users_list', handleOnlineUsers);
      socket.off('connect');
      socket.off('disconnect');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
    };
  }, [socket, currentUser?.id]);

  // 5. Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // 6. Typing handlers with throttle
  const handleTypingStart = useCallback(() => {
    if (!socket || !selectedChat || selectedChat.type !== 'user') return;
    
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 1000) return; // Throttle to 1 second
    
    lastTypingEmitRef.current = now;
    setIsTyping(true);
    
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }
    
    // Send typing indicator
    sendTypingIndicator(selectedChat.id, true);
    
    // Clear after 2 seconds
    typingDebounceRef.current = setTimeout(() => {
      handleTypingStop();
    }, 2000);
  }, [socket, selectedChat, sendTypingIndicator]);

  const handleTypingStop = useCallback(() => {
    if (!socket || !selectedChat || selectedChat.type !== 'user') return;
    
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }
    
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(selectedChat.id, false);
    }
  }, [socket, selectedChat, isTyping, sendTypingIndicator]);

  // 7. Send message function
 const handleSendMessage = async () => {
  if (!newMessage.trim()) return;
  if (!selectedChat) {
    alert('Please select a chat first!');
    return;
  }
    
    const messageToSend = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    
   // Clear input
  setNewMessage('');
  
  // Stop typing indicator
  handleTypingStop();
  
  // Optimistic update
  const tempMessage = {
    id: tempId,
    sender_id: currentUser?.id,
    sender_username: currentUser?.username || 'You',
    sender_profile_pic: currentUser?.profile_pic,
    message: messageToSend,
    created_at: new Date().toISOString(),
    isOwn: true,
    sent: false,
    read_status: 0
  };
  
  setMessages(prev => [...prev, tempMessage]);
  
  try {
    if (selectedChat.type === 'user') {
      // Send via socket - SIMPLIFIED
      console.log('📤 ChatPage: Sending private message');
      socket.emit('private_message', {
        to: selectedChat.id,
        message: messageToSend,
        tempId: tempId
      });
      
        // Update conversation list immediately
        setConversations(prev => {
          let updated = [...prev];
          const convIndex = updated.findIndex(c => c.other_user_id === selectedChat.id);
          
          if (convIndex >= 0) {
            updated[convIndex] = {
              ...updated[convIndex],
              last_message: messageToSend,
              last_message_time: new Date().toISOString(),
              unread_count: 0
            };
          } else {
            updated.unshift({
              other_user_id: selectedChat.id,
              other_user_username: selectedChat.name,
              profile_pic: selectedChat.profilePic,
              last_message: messageToSend,
              last_message_time: new Date().toISOString(),
              unread_count: 0
            });
          }
          
          return updated.sort((a, b) => 
            new Date(b.last_message_time) - new Date(a.last_message_time)
          );
        });
        
         // Also save via REST API for backup
      try {
        await chatAPI.sendMessage({
          receiverId: selectedChat.id,
          message: messageToSend
        });
      } catch (apiError) {
        console.error('⚠️ REST API save failed:', apiError);
      }
      
    } else if (selectedChat.type === 'group') {
      console.log('📤 ChatPage: Sending group message');
      socket.emit('group_message', {
        groupId: selectedChat.id,
        message: messageToSend,
        tempId: tempId
      });
      
      try {
        await chatAPI.sendMessage({
          groupId: selectedChat.id,
          message: messageToSend
        });
      } catch (apiError) {
        console.error('⚠️ Group message save failed:', apiError);
      }
    }
    
  } catch (error) {
    console.error('❌ ChatPage: Failed to send message:', error);
    // Remove optimistic update on error
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
    alert('Failed to send message: ' + error.message);
  }
};
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 8. Filter functions
  const filteredConversations = conversations.filter(conv =>
    conv.other_user_username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter(friend =>
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groupConversations.filter(group =>
    group.group_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 9. Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chat...</p>
          <p className="text-sm text-gray-500 mt-2">
            {socketReady ? 'Connected' : 'Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Chats</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${socketReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <button className="icon-button" onClick={() => navigate('/profile')}>
              <img 
                src={currentUser?.profile_pic ? `/uploads/${currentUser.profile_pic}` : '/default-avatar.png'} 
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="chat-search">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input"
          />
        </div>

        {/* Tabs */}
        <div className="chat-tabs">
          <button
            className={`chat-tab ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chats</span>
            {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
              <span className="unread-badge">
                {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>
          <button
            className={`chat-tab ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <Users className="w-4 h-4" />
            <span>Groups</span>
          </button>
          <button
            className={`chat-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <Users className="w-4 h-4" />
            <span>Friends</span>
            <span className="online-count">
              {friends.filter(f => f.status === 'online').length}
            </span>
          </button>
        </div>

        {/* Chat List */}
        <div className="chat-list">
          {activeTab === 'chats' && (
            <>
              {filteredConversations.length > 0 ? (
                filteredConversations.map(conversation => (
                  <div
                    key={conversation.other_user_id}
                    className={`chat-list-item ${
                      selectedChat?.id === conversation.other_user_id ? 'active' : ''
                    }`}
                    onClick={() => {
                      const chatData = {
                        id: conversation.other_user_id,
                        name: conversation.other_user_username,
                        type: 'user',
                        profilePic: conversation.profile_pic,
                        rank: conversation.rank,
                        status: isUserOnline(conversation.other_user_id) ? 'online' : 'offline'
                      };
                      setSelectedChat(chatData);
                      // Clear typing indicator
                      setTypingUsers(prev => ({ ...prev, [conversation.other_user_id]: false }));
                    }}
                  >
                    <div className="chat-avatar">
                      <div className="relative">
                        {conversation.profile_pic && conversation.profile_pic !== 'default.png' ? (
                          <img 
                            src={`/uploads/${conversation.profile_pic}`} 
                            alt={conversation.other_user_username}
                            className="chat-avatar-img"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                        ) : (
                          <div className="chat-avatar-default">
                            {conversation.other_user_username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={`chat-status ${isUserOnline(conversation.other_user_id) ? 'online' : 'offline'}`}></div>
                      </div>
                    </div>
                    <div className="chat-info">
                      <div className="flex items-center justify-between">
                        <span className="chat-name-text">{conversation.other_user_username}</span>
                        {conversation.rank && (
                          <span className="chat-rank-text">{conversation.rank}</span>
                        )}
                      </div>
                      <p className="chat-preview">
                        {typingUsers[conversation.other_user_id] ? (
                          <span className="text-purple-400 italic">typing...</span>
                        ) : conversation.last_message ? (
                          conversation.last_message.length > 30 
                            ? conversation.last_message.substring(0, 30) + '...' 
                            : conversation.last_message
                        ) : (
                          'Start a conversation'
                        )}
                      </p>
                    </div>
                    <div className="chat-meta">
                      <span className="chat-time">
                        {formatTime(conversation.last_message_time)}
                      </span>
                      {unreadCounts[conversation.other_user_id] > 0 && (
                        <span className="chat-unread">
                          {unreadCounts[conversation.other_user_id]}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="chat-empty">
                  <MessageSquare className="w-12 h-12 text-gray-600 mb-2" />
                  <p className="text-gray-400">No conversations yet</p>
                  <button 
                    onClick={() => setActiveTab('friends')}
                    className="mt-2 text-purple-400 text-sm hover:underline"
                  >
                    Add friends to start chatting
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'groups' && (
            <>
              {filteredGroups.length > 0 ? (
                filteredGroups.map(group => (
                  <div
                    key={group.group_id}
                    className={`chat-list-item ${
                      selectedChat?.id === group.group_id ? 'active' : ''
                    }`}
                    onClick={() => setSelectedChat({
                      id: group.group_id,
                      name: group.group_name,
                      type: 'group',
                      game: group.game_specialty,
                      memberCount: group.member_count || 0
                    })}
                  >
                    <div className="chat-avatar group-avatar">
                      <Users className="w-6 h-6" />
                      {group.member_count > 0 && (
                        <span className="group-count">{group.member_count}</span>
                      )}
                    </div>
                    <div className="chat-info">
                      <div className="chat-name">
                        <span>{group.group_name}</span>
                      </div>
                      <p className="chat-preview">
                        {group.last_message 
                          ? (group.last_message.length > 30 
                              ? group.last_message.substring(0, 30) + '...' 
                              : group.last_message)
                          : 'No messages yet'}
                      </p>
                    </div>
                    <div className="chat-meta">
                      <span className="chat-time">
                        {formatTime(group.last_message_time)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="chat-empty">
                  <Users className="w-12 h-12 text-gray-600 mb-2" />
                  <p className="text-gray-400">No group chats</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'friends' && (
            <>
              {filteredFriends.length > 0 ? (
                filteredFriends.map(friend => (
                  <div
                    key={friend.id}
                    className={`chat-list-item ${
                      selectedChat?.id === friend.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedChat({
                        id: friend.id,
                        name: friend.username,
                        type: 'user',
                        profilePic: friend.profile_pic,
                        rank: friend.rank,
                        status: friend.status || 'offline',
                        winRate: friend.win_rate,
                        wins: friend.wins,
                        losses: friend.losses
                      });
                      // Switch to chats tab
                      setActiveTab('chats');
                    }}
                  >
                    <div className="chat-avatar">
                      <div className="relative">
                        {friend.profile_pic && friend.profile_pic !== 'default.png' ? (
                          <img 
                            src={`/uploads/${friend.profile_pic}`} 
                            alt={friend.username}
                            className="chat-avatar-img"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                        ) : (
                          <div className="chat-avatar-default">
                            {friend.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={`chat-status ${friend.status === 'online' ? 'online' : 'offline'}`}></div>
                      </div>
                    </div>
                    <div className="chat-info">
                      <div className="flex items-center justify-between">
                        <span className="chat-name-text">{friend.username}</span>
                        {friend.rank && (
                          <span className="chat-rank-text">{friend.rank}</span>
                        )}
                      </div>
                      <p className="chat-preview">
                        {friend.status === 'online' ? (
                          <span className="text-green-400">Online • {friend.win_rate || 0}% win rate</span>
                        ) : (
                          `Win Rate: ${friend.win_rate || 0}%`
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="chat-empty">
                  <Users className="w-12 h-12 text-gray-600 mb-2" />
                  <p className="text-gray-400">No friends yet</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-main">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <button 
                  className="back-button"
                  onClick={() => {
                    setSelectedChat(null);
                    setTypingUsers({});
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="chat-header-avatar">
                  <div className="relative">
                    {selectedChat.profilePic && selectedChat.profilePic !== 'default.png' ? (
                      <img 
                        src={`/uploads/${selectedChat.profilePic}`} 
                        alt={selectedChat.name}
                        className="chat-avatar-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                    ) : selectedChat.type === 'user' ? (
                      <div className="chat-avatar-default">
                        {selectedChat.name?.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="chat-avatar-default group">
                        <Users className="w-6 h-6" />
                      </div>
                    )}
                    {selectedChat.type === 'user' && (
                      <div className={`chat-header-status ${selectedChat.status === 'online' ? 'online' : 'offline'}`}></div>
                    )}
                  </div>
                </div>
                <div>
                  <h3>{selectedChat.name}</h3>
                  {selectedChat.type === 'user' ? (
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${selectedChat.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                      <p className="text-sm text-gray-400">
                        {selectedChat.status === 'online' ? 'Online' : 'Offline'} • {selectedChat.rank}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      {selectedChat.memberCount || 0} members • {selectedChat.game} • Group Chat
                    </p>
                  )}
                </div>
              </div>
              <div className="chat-header-actions">
                {selectedChat.type === 'user' && selectedChat.status === 'online' && (
                  <>
                    <button className="icon-button" title="Voice call">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="icon-button" title="Video call">
                      <Video className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button className="icon-button" title="Chat info">
                  <Info className="w-5 h-5" />
                </button>
                <button className="icon-button" title="More options">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" ref={chatContainerRef}>
              {messages.length > 0 ? (
                <>
                  {messages.map((message, index) => {
                    const isOwnMessage = message.sender_id === currentUser?.id || message.isOwn;
                    const showAvatar = !isOwnMessage && (
                      index === 0 || 
                      messages[index - 1]?.sender_id !== message.sender_id
                    );
                    
                    return (
                      <div
                        key={message.id || index}
                        className={`message-container ${isOwnMessage ? 'own' : 'other'}`}
                      >
                        {showAvatar && !isOwnMessage && (
                          <div className="message-avatar">
                            {message.sender_profile_pic && message.sender_profile_pic !== 'default.png' ? (
                              <img 
                                src={`/uploads/${message.sender_profile_pic}`} 
                                alt={message.sender_username}
                                className="message-avatar-img"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/default-avatar.png';
                                }}
                              />
                            ) : (
                              <div className="message-avatar-default">
                                {message.sender_username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="message-wrapper">
                          {!isOwnMessage && showAvatar && (
                            <span className="message-sender">{message.sender_username}</span>
                          )}
                          <div className={`message ${isOwnMessage ? 'own' : 'other'}`}>
                            <p>{message.message}</p>
                          </div>
                          <div className="message-footer">
                            <span className="message-time">
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isOwnMessage && (
                              <span className="message-status">
                                {message.read_status === 1 ? (
                                  <CheckCheck className="w-4 h-4 text-blue-500" title="Read" />
                                ) : message.sent !== false ? (
                                  <Check className="w-4 h-4 text-gray-400" title="Sent" />
                                ) : (
                                  <Circle className="w-3 h-3 text-gray-500 animate-pulse" title="Sending..." />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="chat-empty-center">
                  <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                  <h3 className="text-white mb-2">No messages yet</h3>
                  <p className="text-gray-400">
                    Send a message to start the conversation!
                  </p>
                </div>
              )}
              
              {/* Typing Indicator */}
              {typingUsers[selectedChat?.id] && selectedChat?.type === 'user' && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p className="text-sm text-gray-400 ml-2">
                    {selectedChat.name} is typing...
                  </p>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="chat-input-container">
              <div className="chat-input-tools">
                <button className="chat-input-tool" title="Emoji">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="chat-input-tool" title="Attach file">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="chat-input-tool" title="Voice message">
                  <Mic className="w-5 h-5" />
                </button>
              </div>
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (!e.target.value) {
                    handleTypingStop();
                  } else {
                    handleTypingStart();
                  }
                }}
                onBlur={handleTypingStop}
                onKeyDown={handleKeyPress}
                placeholder={`Message ${selectedChat.name}...`}
                className="chat-input"
                rows="1"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className={`send-button ${newMessage.trim() ? 'active' : ''}`}
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="chat-welcome">
            <div className="chat-welcome-content">
              <div className="relative mb-6">
                <MessageSquare className="w-24 h-24 text-purple-500" />
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${socketReady ? 'bg-green-500' : 'bg-red-500'}`}>
                  {socketReady ? <Wifi className="w-4 h-4 text-white" /> : <WifiOff className="w-4 h-4 text-white" />}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Welcome to Chat</h1>
              <p className="text-gray-400 text-lg mb-8">
                Select a conversation from the sidebar to start chatting
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mb-8">
                <div className="feature-card">
                  <MessageSquare className="w-8 h-8 text-purple-400 mb-2" />
                  <h3 className="text-white font-medium">Real-Time Chat</h3>
                  <p className="text-gray-400 text-sm">Instant messaging with typing indicators</p>
                </div>
                <div className="feature-card">
                  <Users className="w-8 h-8 text-blue-400 mb-2" />
                  <h3 className="text-white font-medium">Online Status</h3>
                  <p className="text-gray-400 text-sm">See who's online in real-time</p>
                </div>
                <div className="feature-card">
                  <CheckCheck className="w-8 h-8 text-green-400 mb-2" />
                  <h3 className="text-white font-medium">Read Receipts</h3>
                  <p className="text-gray-400 text-sm">Know when your messages are read</p>
                </div>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg max-w-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${socketReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={socketReady ? 'text-green-400' : 'text-red-400'}>
                      {socketReady ? 'Connected to chat server' : 'Disconnected from chat server'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {onlineUsers?.length || 0} users online
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Friends online: </span>
                    <span className="text-green-400 font-medium">
                      {friends.filter(f => f.status === 'online').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Unread messages: </span>
                    <span className="text-yellow-400 font-medium">
                      {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;