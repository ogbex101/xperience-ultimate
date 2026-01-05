import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatWindow.css';

const ChatWindow = ({ friendId, friendUsername, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        // Connect to WebSocket
        const token = localStorage.getItem('token');
        const newSocket = io(process.env.REACT_APP_API_URL, {
            auth: { token }
        });
        
        setSocket(newSocket);

        // Load chat history
        loadChatHistory();

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [friendId]);

    useEffect(() => {
        if (!socket) return;

        // Listen for new messages
        socket.on('new_message', (data) => {
            if (data.from === friendId) {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender_id: data.from,
                    message: data.message,
                    created_at: data.timestamp
                }]);
            }
        });

        // Listen for typing indicator
        socket.on('user_typing', (data) => {
            if (data.userId === friendId) {
                setIsTyping(true);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                }, 2000);
            }
        });

        return () => {
            socket.off('new_message');
            socket.off('user_typing');
        };
    }, [socket, friendId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChatHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/chat/history/${friendId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            to: friendId,
            message: newMessage.trim()
        };

        socket.emit('private_message', messageData);
        
        // Add message to local state immediately
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender_id: parseInt(localStorage.getItem('userId')),
            message: newMessage.trim(),
            created_at: new Date().toISOString()
        }]);
        
        setNewMessage('');
    };

    const handleTyping = () => {
        if (!socket) return;
        
        socket.emit('typing', { to: friendId });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="chat-user-info">
                    <div className="user-avatar">
                        <span>{friendUsername.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <h3>{friendUsername}</h3>
                        {isTyping && <span className="typing-indicator">Typing...</span>}
                    </div>
                </div>
                <button className="close-chat" onClick={onClose}>×</button>
            </div>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div 
                        key={msg.id || msg.message_id}
                        className={`message ${msg.sender_id === friendId ? 'received' : 'sent'}`}
                    >
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

            <form className="chat-input-form" onSubmit={sendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                    }}
                    placeholder="Type a message..."
                    className="chat-input"
                />
                <button type="submit" className="send-button">
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;