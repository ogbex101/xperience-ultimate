import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './GroupChat.css';

const GroupChat = ({ groupId, groupName, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [members, setMembers] = useState([]);
    const [onlineMembers, setOnlineMembers] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const newSocket = io(process.env.REACT_APP_API_URL, {
            auth: { token }
        });
        
        setSocket(newSocket);

        // Load group members and chat history
        loadGroupData();

        // Join group room
        newSocket.emit('join_group', { groupId });

        // Listen for group messages
        newSocket.on('group_message', (data) => {
            if (data.groupId === groupId) {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender_id: data.senderId,
                    sender_username: data.senderUsername,
                    message: data.message,
                    created_at: new Date().toISOString()
                }]);
            }
        });

        // Listen for member join/leave
        newSocket.on('group_member_update', (data) => {
            if (data.groupId === groupId) {
                loadGroupMembers();
            }
        });

        return () => {
            newSocket.emit('leave_group', { groupId });
            newSocket.disconnect();
        };
    }, [groupId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadGroupData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Load group members
            const membersRes = await fetch(`/api/groups/${groupId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const membersData = await membersRes.json();
            if (membersData.success) {
                setMembers(membersData.members);
            }

            // Load chat history (you'll need to implement this endpoint)
            const chatRes = await fetch(`/api/chat/group/${groupId}/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const chatData = await chatRes.json();
            if (chatData.success) {
                setMessages(chatData.messages);
            }
        } catch (error) {
            console.error('Error loading group data:', error);
        }
    };

    const loadGroupMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/groups/${groupId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMembers(data.members);
            }
        } catch (error) {
            console.error('Error loading group members:', error);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            groupId: groupId,
            message: newMessage.trim()
        };

        socket.emit('group_message', messageData);
        
        // Add message to local state immediately
        const userId = parseInt(localStorage.getItem('userId'));
        const username = localStorage.getItem('username');
        
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender_id: userId,
            sender_username: username,
            message: newMessage.trim(),
            created_at: new Date().toISOString()
        }]);
        
        setNewMessage('');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="group-chat-container">
            <div className="group-chat-sidebar">
                <h3 className="sidebar-title">Group Members</h3>
                <div className="members-list">
                    {members.map(member => (
                        <div key={member.user_id} className="member-item">
                            <div className="member-avatar">
                                <span>{member.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="member-info">
                                <span className="member-name">{member.username}</span>
                                <span className={`member-role ${member.role}`}>
                                    {member.role}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="group-chat-main">
                <div className="group-chat-header">
                    <div className="group-info">
                        <h2>{groupName}</h2>
                        <span className="member-count">{members.length} members</span>
                    </div>
                    <button className="close-group-chat" onClick={onClose}>×</button>
                </div>

                <div className="group-chat-messages">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id || msg.message_id}
                            className={`group-message ${msg.sender_id === parseInt(localStorage.getItem('userId')) ? 'own' : 'other'}`}
                        >
                            {msg.sender_id !== parseInt(localStorage.getItem('userId')) && (
                                <div className="message-sender">
                                    {msg.sender_username}
                                </div>
                            )}
                            <div className="message-content">
                                {msg.message}
                                <span className="message-time">
                                    {formatTime(msg.created_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form className="group-chat-input-form" onSubmit={sendMessage}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message to the group..."
                        className="group-chat-input"
                    />
                    <button type="submit" className="group-send-button">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GroupChat;