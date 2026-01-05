import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Clock } from 'lucide-react';

const TournamentChat = ({ tournamentId, tournamentName, userId, username, isParticipant }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // TODO: Implement chat API
    loadMessages();
    scrollToBottom();
  }, []);

  const loadMessages = async () => {
    try {
      // Simulate loading messages
      setMessages([
        { id: 1, user_id: 4, username: 'lenovo', message: 'Good luck everyone!', created_at: new Date().toISOString() },
        { id: 2, user_id: 1, username: 'danex', message: 'Who wants to warm up?', created_at: new Date().toISOString() },
        { id: 3, user_id: 8, username: 'destroyer', message: 'I\'m ready to win this!', created_at: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isParticipant) return;

    try {
      setLoading(true);
      // TODO: Implement send message API
      const tempMessage = {
        id: Date.now(),
        user_id: userId,
        username: username,
        message: newMessage,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isParticipant) {
    return (
      <div className="card text-center py-8">
        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Tournament Chat</h3>
        <p className="text-gray-400">Join the tournament to participate in the chat</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Tournament Chat</h3>
            <p className="text-gray-400 text-sm">Chat with {tournamentName} participants</p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {messages.length} messages
        </div>
      </div>

      {/* Messages Container */}
      <div className="h-80 overflow-y-auto mb-4 bg-gray-900 rounded-lg p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg ${
                msg.user_id === userId
                  ? 'bg-purple-500/10 border border-purple-500/20'
                  : 'bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-400" />
                  </div>
                  <span className={`text-sm font-medium ${
                    msg.user_id === userId ? 'text-purple-400' : 'text-white'
                  }`}>
                    {msg.username}
                  </span>
                  {msg.user_id === 4 && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                      Creator
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(msg.created_at)}</span>
                </div>
              </div>
              <p className="text-gray-300 text-sm">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="input-primary flex-1"
          maxLength="500"
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-4"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="text-xs text-gray-500 mt-2 text-center">
        Only tournament participants can chat here
      </div>
    </div>
  );
};

export default TournamentChat;