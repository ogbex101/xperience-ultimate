// socketService.js - FIXED VERSION WITH CORRECT MATCH CHAT HANDLING
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.eventListeners = new Map();
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = 5;
    this.matchChatCallbacks = new Map(); // Store match chat callbacks
  }

  async connect() {
    // Return existing socket if connected
    if (this.socket && this.isConnected && this.socket.connected) {
      console.log('✅ SocketService: Reusing existing connection');
      return this.socket;
    }

    // Return existing promise if connecting
    if (this.connectionPromise) {
      console.log('⏳ SocketService: Connection in progress, waiting...');
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        console.log('🔍 SocketService: Token check -', token ? 'Present' : 'Missing');
        
        if (!token) {
          reject(new Error('No authentication token found'));
          return;
        }

        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        console.log('🔗 SocketService: Connecting to:', socketUrl);
        
        // Create socket with improved options
        this.socket = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectionAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 15000,
          autoConnect: true,
          forceNew: true
        });

        // ============ EVENT LISTENERS ============
        
        // Successful connection
        this.socket.on('connect', () => {
          console.log('✅ SocketService: Connected, ID:', this.socket.id);
          console.log('✅ SocketService: User authenticated as:', this.socket.auth);
          this.isConnected = true;
          this.reconnectionAttempts = 0;
          
          // Emit join_user event to let server know we're online
          setTimeout(() => {
            if (this.socket && this.socket.connected) {
              console.log('👤 SocketService: Emitting join_user event');
              this.socket.emit('join_user', { 
                userId: this.getUserIdFromToken(token) 
              });
            }
          }, 500);
          
          resolve(this.socket);
          this.connectionPromise = null;
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('❌ SocketService: Connection error:', error.message);
          this.isConnected = false;
          this.reconnectionAttempts++;
          
          if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
            console.error('💥 SocketService: Max reconnection attempts reached');
            this.cleanup();
            reject(new Error('Failed to connect after multiple attempts'));
            this.connectionPromise = null;
          }
        });

        // Disconnected
        this.socket.on('disconnect', (reason) => {
          console.log('🔌 SocketService: Disconnected. Reason:', reason);
          this.isConnected = false;
          
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            console.log('🔄 SocketService: Server disconnected, will try to reconnect');
            setTimeout(() => {
              if (!this.isConnected) {
                this.connect();
              }
            }, 3000);
          }
        });

        // ============ MATCH CHAT EVENTS - FIXED ============
        
        // Match chat messages - FIXED VERSION
        this.socket.on('match_chat_message', (data) => {
          console.log('💬 SocketService: Match chat message received:', data);
          
          // FIXED: Extract match ID correctly - handle both naming conventions
          const matchId = data.match_id || data.matchId;
          const messageData = data; // Keep the full message data
          
          console.log('💬 Extracted matchId:', matchId);
          console.log('💬 Full message data:', messageData);
          
          // Call specific match chat callback if registered
          if (matchId && this.matchChatCallbacks.has(matchId)) {
            const callback = this.matchChatCallbacks.get(matchId);
            callback(messageData); // Pass the FULL message data, not just the text
          }
          
          // Also emit to general listeners
          this.emitEventToListeners('match_chat_message', messageData);
        });

        // Match chat joined
        this.socket.on('match_chat_joined', (data) => {
          console.log('✅ SocketService: Joined match chat:', data);
          this.emitEventToListeners('match_chat_joined', data);
        });

        // Match chat error
        this.socket.on('match_chat_error', (data) => {
          console.error('❌ SocketService: Match chat error:', data);
          this.emitEventToListeners('match_chat_error', data);
        });

        // Match user typing
        this.socket.on('match_user_typing', (data) => {
          console.log('⌨️ SocketService: Match user typing:', data);
          this.emitEventToListeners('match_user_typing', data);
        });

        // Match system message
        this.socket.on('match_system_message', (data) => {
          console.log('📢 SocketService: Match system message:', data);
          this.emitEventToListeners('match_system_message', data);
        });

        // User joined/left chat
        this.socket.on('user_joined_chat', (data) => {
          console.log('👤 SocketService: User joined chat:', data);
          this.emitEventToListeners('user_joined_chat', data);
        });

        this.socket.on('user_left_chat', (data) => {
          console.log('👤 SocketService: User left chat:', data);
          this.emitEventToListeners('user_left_chat', data);
        });

        // ============ EXISTING CHAT EVENTS ============
        
        // Online users list
        this.socket.on('online_users_list', (data) => {
          console.log('👥 SocketService: Online users received:', data.users?.length || 0, 'users');
          this.emitEventToListeners('online_users_list', data);
        });

        // Friend status changes
        this.socket.on('friend_status_change', (data) => {
          console.log('👤 SocketService: Friend status change:', data);
          this.emitEventToListeners('friend_status_change', data);
        });

        // New messages
        this.socket.on('new_message', (data) => {
          console.log('📩 SocketService: New message:', data);
          this.emitEventToListeners('new_message', data);
        });

        // Message delivery confirmations
        this.socket.on('message_sent', (data) => {
          console.log('✅ SocketService: Message sent confirmation:', data);
          this.emitEventToListeners('message_sent', data);
        });

        // Typing indicators
        this.socket.on('user_typing', (data) => {
          console.log('⌨️ SocketService: User typing:', data);
          this.emitEventToListeners('user_typing', data);
        });

        // Error events
        this.socket.on('error', (error) => {
          console.error('❌ SocketService: Socket error:', error);
          this.emitEventToListeners('error', error);
        });

        // Heartbeat response
        this.socket.on('heartbeat_response', () => {
          console.log('💓 SocketService: Heartbeat received');
        });

        // Match updates
        this.socket.on('match_updated', (data) => {
          console.log('🔄 SocketService: Match updated:', data);
          this.emitEventToListeners('match_updated', data);
        });

        // Set connection timeout
        setTimeout(() => {
          if (!this.isConnected && this.connectionPromise) {
            console.error('⏰ SocketService: Connection timeout');
            this.cleanup();
            reject(new Error('Connection timeout - server not responding'));
            this.connectionPromise = null;
          }
        }, 15000);

      } catch (error) {
        console.error('💥 SocketService: Connection setup error:', error);
        this.cleanup();
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // ============ MATCH CHAT METHODS ============
  
  // Join match chat
  joinMatchChat(matchId) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ SocketService: Cannot join match chat - not connected');
      return false;
    }

    console.log(`💬 SocketService: Joining match chat ${matchId}`);
    this.socket.emit('join_match_chat', { matchId });
    return true;
  }

  // Leave match chat
  leaveMatchChat(matchId) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ SocketService: Cannot leave match chat - not connected');
      return false;
    }

    console.log(`💬 SocketService: Leaving match chat ${matchId}`);
    this.socket.emit('leave_match_chat', { matchId });
    
    // Remove callback for this match
    this.matchChatCallbacks.delete(matchId);
    return true;
  }

  // Send match chat message
  sendMatchChatMessage(matchId, message, tempId = null) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ SocketService: Cannot send match message - not connected');
      return false;
    }

    console.log(`📤 SocketService: Sending match chat message to match ${matchId}`);
    this.socket.emit('match_chat_message', {
      matchId,
      message,
      tempId,
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // Send match typing indicator
  sendMatchTypingIndicator(matchId, isTyping) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ SocketService: Cannot send match typing indicator - not connected');
      return false;
    }

    console.log(`⌨️ SocketService: Sending match typing indicator to match ${matchId}:`, isTyping);
    this.socket.emit('match_typing', {
      matchId,
      isTyping,
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // Subscribe to match updates
  subscribeMatchUpdates(matchId) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ SocketService: Cannot subscribe to match updates - not connected');
      return false;
    }

    console.log(`🔄 SocketService: Subscribing to match updates ${matchId}`);
    this.socket.emit('subscribe_match_updates', { matchId });
    return true;
  }

  // Register match chat callback
  onMatchChatMessage(matchId, callback) {
    this.matchChatCallbacks.set(matchId, callback);
    console.log(`🎯 SocketService: Registered callback for match chat ${matchId}`);
  }

  // Remove match chat callback
  offMatchChatMessage(matchId) {
    this.matchChatCallbacks.delete(matchId);
    console.log(`🎯 SocketService: Removed callback for match chat ${matchId}`);
  }

  // Helper method to extract user ID from token
  getUserIdFromToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.userId;
    } catch (error) {
      console.warn('⚠️ SocketService: Could not extract user ID from token');
      return null;
    }
  }

  // Register event listener
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit event to all registered listeners
  emitEventToListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Send private message
  sendPrivateMessage(to, message, tempId = null) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ SocketService: Cannot send message - not connected');
      return false;
    }

    console.log('📤 SocketService: Sending private message to:', to);
    this.socket.emit('private_message', {
      to,
      message,
      tempId,
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // Send typing indicator
  sendTypingIndicator(to, isTyping) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ SocketService: Cannot send typing indicator - not connected');
      return false;
    }

    console.log('⌨️ SocketService: Sending typing indicator to:', to, isTyping);
    this.socket.emit('typing', {
      to,
      isTyping,
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // Join user to their personal room
  joinUserRoom() {
    if (!this.socket || !this.isConnected) return false;
    
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userId = this.getUserIdFromToken(token);
    
    if (userId) {
      console.log('👤 SocketService: Joining user room for ID:', userId);
      this.socket.emit('join_user', { userId });
      return true;
    }
    
    return false;
  }

  // Get current socket status
  getStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectionAttempts: this.reconnectionAttempts
    };
  }

  // Cleanup
  cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.eventListeners.clear();
    this.matchChatCallbacks.clear();
  }

  disconnect() {
    console.log('🔌 SocketService: Manual disconnect');
    this.cleanup();
    this.connectionPromise = null;
  }

  // Wrapper methods for direct socket access
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      return true;
    }
    return false;
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;