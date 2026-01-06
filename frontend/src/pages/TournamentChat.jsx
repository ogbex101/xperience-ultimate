import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Crown, MessageSquare, Loader } from 'lucide-react';
import { tournamentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const TournamentChat = ({ tournamentId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetchChatMessages();
    checkIfCreator();
    
    // Set up polling for new messages
    const interval = setInterval(fetchChatMessages, 3000);
    
    return () => clearInterval(interval);
  }, [tournamentId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatMessages = async () => {
    try {
      const response = await tournamentsAPI.getChat(tournamentId);
      if (response.success) {
        setMessages(response.messages || []);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfCreator = async () => {
    try {
      const response = await tournamentsAPI.getById(tournamentId);
      if (response.success) {
        setIsCreator(response.tournament.creator_id === user?.id);
      }
    } catch (error) {
      console.error('Error checking creator status:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    setError('');

    try {
      const response = await tournamentsAPI.sendChatMessage(tournamentId, newMessage.trim());
      
      if (response.success) {
        setNewMessage('');
        // Add the new message to the list
        setMessages(prev => [...prev, response.chat_message]);
      } else {
        setError(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserRoleBadge = (message) => {
    if (message.user_role === 'creator') {
      return (
        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center">
          <Crown className="w-3 h-3 mr-1" />
          Creator
        </span>
      );
    } else if (message.user_role === 'you') {
      return (
        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
          You
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="font-semibold text-white">Tournament Chat</h3>
            <p className="text-sm text-gray-400">Communicate with participants</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900"
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">No messages yet</h4>
            <p className="text-gray-400">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                  message.user_id === user?.id
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      {message.user_id !== user?.id && (
                        <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <span className={`font-medium text-sm ${
                        message.user_id === user?.id ? 'text-purple-300' : 'text-white'
                      }`}>
                        {message.user_role === 'you' ? 'You' : message.username}
                      </span>
                    </div>
                    {getUserRoleBadge(message)}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTime(message.created_at)}
                  </span>
                </div>

                {/* Message Body */}
                <p className="text-gray-200 text-sm break-words">
                  {message.message}
                </p>

                {/* User Rank (if available) */}
                {message.rank && message.user_id !== user?.id && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                      Rank: {message.rank}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="input-primary flex-1"
            maxLength={500}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`px-4 py-2 rounded-lg font-medium ${
              newMessage.trim() && !sending
                ? 'btn-primary'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Messages are visible to all tournament participants and the creator
        </p>
      </div>
    </div>
  );
};

export default TournamentChat;