// SocketContext.jsx - COMPLETELY UPDATED
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);
  
  const { isAuthenticated, user } = useAuth();
  const isConnectingRef = useRef(false);
  const reconnectTimerRef = useRef(null);

  // Online users management
  const updateOnlineUsers = useCallback((userId, isOnline, username = '') => {
    setOnlineUsers(prev => {
      const index = prev.findIndex(u => u.userId === userId);
      
      if (index >= 0) {
        // Update existing user
        const updated = [...prev];
        updated[index] = { 
          ...updated[index],
          userId,
          isOnline,
          username: username || updated[index].username,
          lastSeen: isOnline ? new Date() : updated[index].lastSeen
        };
        return updated;
      } else {
        // Add new user
        return [...prev, { 
          userId, 
          isOnline, 
          username,
          lastSeen: isOnline ? new Date() : null
        }];
      }
    });
  }, []);

  // Connect socket
  const connectSocket = useCallback(async () => {
    if (isConnectingRef.current) {
      console.log('🔗 SocketProvider: Already connecting');
      return;
    }

    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!authToken) {
      console.log('🔗 SocketProvider: No auth token');
      setConnectionError('Please login to connect to chat');
      return;
    }

    if (!user?.id) {
      console.log('🔗 SocketProvider: Waiting for user data');
      return;
    }

    isConnectingRef.current = true;
    console.log('🔗 SocketProvider: Starting connection...');

    try {
      const socket = await socketService.connect();
      
      if (!socket) {
        throw new Error('Failed to get socket instance');
      }

      console.log('✅ SocketProvider: Socket connected');
      setSocketInstance(socket);
      setIsConnected(true);
      setConnectionError(null);

      // ============ SET UP LISTENERS ============
      
      // Listen for online users list
      socketService.addEventListener('online_users_list', (data) => {
        console.log('👥 SocketProvider: Online users list received:', data);
        if (data.users && Array.isArray(data.users)) {
          data.users.forEach(userId => {
            updateOnlineUsers(userId, true);
          });
        }
      });

      // Listen for friend status changes
      socketService.addEventListener('friend_status_change', (data) => {
        console.log('👤 SocketProvider: Friend status:', data);
        updateOnlineUsers(data.userId, data.isOnline, data.username);
      });

      // Listen for messages
      socketService.addEventListener('new_message', (data) => {
        console.log('📩 SocketProvider: New message:', data);
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'message',
          from: data.sender_id,
          fromName: data.sender_username,
          message: data.message,
          timestamp: new Date(),
          read: false
        }]);
      });

      // Listen for typing indicators
      socketService.addEventListener('user_typing', (data) => {
        console.log('⌨️ SocketProvider: User typing:', data);
        // You can handle this in ChatPage
      });

      // Listen for errors
      socketService.addEventListener('error', (error) => {
        console.error('❌ SocketProvider: Socket error:', error);
        setConnectionError(error.message || 'Socket error');
      });

      // Join user room
      setTimeout(() => {
        socketService.joinUserRoom();
      }, 1000);

    } catch (error) {
      console.error('💥 SocketProvider: Connection failed:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
      setSocketInstance(null);
      
      // Try to reconnect after delay
      if (isAuthenticated && user?.id) {
        reconnectTimerRef.current = setTimeout(() => {
          console.log('🔄 SocketProvider: Attempting to reconnect...');
          connectSocket();
        }, 5000);
      }
    } finally {
      isConnectingRef.current = false;
    }
  }, [isAuthenticated, user?.id, updateOnlineUsers]);

  // Disconnect function
  const disconnectSocket = useCallback(() => {
    console.log('🔌 SocketProvider: Manual disconnect');
    socketService.disconnect();
    setSocketInstance(null);
    setIsConnected(false);
    setOnlineUsers([]);
    setConnectionError(null);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    console.log('🔍 SocketProvider: Auth state changed', {
      isAuthenticated,
      userId: user?.id,
      isConnected
    });

    if (!isAuthenticated || !user?.id) {
      console.log('⏳ SocketProvider: Not authenticated, disconnecting');
      disconnectSocket();
      return;
    }

    // If already connected, do nothing
    if (socketInstance && isConnected) {
      console.log('✅ SocketProvider: Already connected');
      return;
    }

    // Connect with delay to ensure auth is ready
    const timer = setTimeout(() => {
      connectSocket();
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [isAuthenticated, user?.id, connectSocket, disconnectSocket, socketInstance, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 SocketProvider: Cleaning up');
      disconnectSocket();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [disconnectSocket]);

  // Helper functions
  const isUserOnline = useCallback((userId) => {
    const user = onlineUsers.find(u => u.userId === userId);
    return user ? user.isOnline : false;
  }, [onlineUsers]);

  const sendTypingIndicator = useCallback((to, isTyping) => {
    return socketService.sendTypingIndicator(to, isTyping);
  }, []);

  const sendPrivateMessage = useCallback((to, message, tempId) => {
    return socketService.sendPrivateMessage(to, message, tempId);
  }, []);

  // Context value
  const value = {
    // State
    isConnected,
    onlineUsers,
    notifications,
    connectionError,
    
    // Socket instance
    socket: socketInstance,
    
    // Helper methods
    isUserOnline,
    sendTypingIndicator,
    sendPrivateMessage,
    
    // Connection management
    reconnect: connectSocket,
    disconnect: disconnectSocket,
    
    // Status check
    getOnlineFriendsCount: () => {
      return onlineUsers.filter(u => u.isOnline).length;
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      
      {/* Connection status indicator */}
      {connectionError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50 max-w-md animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="font-medium">⚠️ Connection Error</span>
              <span className="ml-2 text-sm opacity-90 truncate">{connectionError}</span>
            </div>
            <button 
              onClick={connectSocket}
              className="ml-4 bg-white text-red-500 px-3 py-1 rounded text-sm font-medium hover:bg-red-50 transition whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Online status indicator */}
      {isConnected && !connectionError && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            <div>
              <span className="font-medium">Chat Online</span>
              <span className="ml-2 text-xs opacity-90">
                {onlineUsers.filter(u => u.isOnline).length} online
              </span>
            </div>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};