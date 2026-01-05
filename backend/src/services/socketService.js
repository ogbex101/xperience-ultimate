// backend/socketService.js - UPDATED WITH MATCH CHAT FIX
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const onlineUsers = new Map();
const userConnections = new Map();
const matchRooms = new Map(); // Track which users are in which match chats
let ioInstance;

const initializeSocket = (io) => {
  ioInstance = io;
  
  // FIXED: Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    console.log('Socket Auth - Token exists:', !!token);
    
    if (!token) {
      console.log('No token provided');
      return next(new Error('Authentication error: No token provided'));
    }
    
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'your-secret-key');
      
      console.log('Socket Auth - Decoded:', decoded);
      
      socket.userId = decoded.id || decoded.userId;
      socket.username = decoded.username;
      
      if (!socket.userId) {
        console.error('Socket Auth - No userId in token');
        return next(new Error('Authentication error: Invalid token structure'));
      }
      
      next();
    } catch (err) {
      console.error('Socket Auth - Token verification failed:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log('✅ Socket.io: User connected:', {
      userId: socket.userId,
      username: socket.username,
      socketId: socket.id
    });

    // Check if userId is defined
    if (!socket.userId) {
      console.error('❌ Socket.io: User ID is undefined, disconnecting');
      socket.disconnect();
      return;
    }

    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);
    userConnections.set(socket.userId, socket);
    
    // Join user's personal room
    socket.join(`user_${socket.userId}`);
    
    // Notify friends that user is online
    notifyFriendsOnlineStatus(socket.userId, true, socket.username);
    
    // Send initial online users list to this user
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('online_users_list', { users: onlineUserIds });
    
    // Notify others that this user is online
    socket.broadcast.emit('friend_status_change', {
      userId: socket.userId,
      username: socket.username,
      isOnline: true
    });

    // ============ MATCH CHAT FUNCTIONALITY - FIXED ============
    // Join match chat room
    socket.on('join_match_chat', async (data) => {
      try {
        const { matchId } = data;
        
        console.log(`💬 User ${socket.userId} joining match chat ${matchId}`);
        
        // Check if user has access to this match
        const [matchAccess] = await db.execute(
          `SELECT id FROM matches 
           WHERE id = ? AND (
             player1_id = ? OR player2_id = ? 
             OR opponent_type = 'open'
             OR (opponent_type = 'specific' AND opponent_username = (
               SELECT username FROM users WHERE id = ?
             ))
           )`,
          [matchId, socket.userId, socket.userId, socket.userId]
        );

        if (matchAccess.length === 0) {
          console.log(`❌ User ${socket.userId} denied access to match chat ${matchId}`);
          socket.emit('match_chat_error', {
            message: 'Access denied to this match chat'
          });
          return;
        }

        // Join the match chat room
        const roomName = `match_chat_${matchId}`;
        socket.join(roomName);
        
        // Track user's match rooms
        if (!matchRooms.has(socket.userId)) {
          matchRooms.set(socket.userId, new Set());
        }
        matchRooms.get(socket.userId).add(matchId);
        
        console.log(`✅ User ${socket.userId} joined match chat ${matchId}`);
        
        // Send confirmation
        socket.emit('match_chat_joined', {
          matchId: matchId,
          room: roomName
        });
        
        // Notify others in the room
        socket.to(roomName).emit('user_joined_chat', {
          userId: socket.userId,
          username: socket.username,
          matchId: matchId
        });
        
      } catch (error) {
        console.error('Error joining match chat:', error);
        socket.emit('match_chat_error', {
          message: 'Failed to join match chat'
        });
      }
    });

    // Leave match chat room
    socket.on('leave_match_chat', (data) => {
      const { matchId } = data;
      const roomName = `match_chat_${matchId}`;
      
      socket.leave(roomName);
      
      // Remove from tracking
      if (matchRooms.has(socket.userId)) {
        matchRooms.get(socket.userId).delete(matchId);
        if (matchRooms.get(socket.userId).size === 0) {
          matchRooms.delete(socket.userId);
        }
      }
      
      console.log(`💬 User ${socket.userId} left match chat ${matchId}`);
      
      // Notify others in the room
      socket.to(roomName).emit('user_left_chat', {
        userId: socket.userId,
        username: socket.username,
        matchId: matchId
      });
    });

    // Send match chat message - FIXED STRUCTURE
    socket.on('match_chat_message', async (data) => {
      try {
        const { matchId, message, tempId } = data;
        
        console.log(`💬 Match chat message from ${socket.userId} to match ${matchId}`);
        
        // Validate data
        if (!matchId || !message) {
          console.error('Invalid match chat data:', data);
          return;
        }
        
        // Check if user is in the match chat room
        if (!matchRooms.has(socket.userId) || !matchRooms.get(socket.userId).has(matchId)) {
          console.error(`User ${socket.userId} not in match chat ${matchId}`);
          socket.emit('match_chat_error', {
            message: 'You are not in this match chat'
          });
          return;
        }
        
        // Get user info for the message
        const [userInfo] = await db.execute(
          'SELECT username, profile_pic, rank, is_admin FROM users WHERE id = ?',
          [socket.userId]
        );
        
        const user = userInfo[0];
        
        // Create message data
        const messageData = {
          id: tempId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          match_id: matchId,
          user_id: socket.userId,
          username: user.username,
          profile_pic: user.profile_pic,
          rank: user.rank || 'E',
          is_admin: user.is_admin === 1,
          is_system: false,
          message: message,
          created_at: new Date().toISOString(),
          is_current_user: false, // Will be set by each client
          tempId: tempId
        };
        
        // FIXED: Send the message data DIRECTLY, not nested
        const roomName = `match_chat_${matchId}`;
        
        // First send to sender with is_current_user: true
        const senderMessage = {
          ...messageData,
          is_current_user: true
        };
        socket.emit('match_chat_message', senderMessage);
        console.log(`📤 Sent match chat message to sender (${socket.userId})`);
        
        // Then broadcast to everyone else in the room with is_current_user: false
        const broadcastMessage = {
          ...messageData,
          is_current_user: false
        };
        socket.to(roomName).emit('match_chat_message', broadcastMessage);
        console.log(`📢 Broadcast match chat message to room ${roomName}`);
        
        // Save message to database (async, don't wait)
        saveMatchChatMessage(matchId, socket.userId, message);
        
      } catch (error) {
        console.error('Error sending match chat message:', error);
        socket.emit('match_chat_error', {
          message: 'Failed to send message'
        });
      }
    });

    // Match typing indicator
    socket.on('match_typing', (data) => {
      const { matchId, isTyping } = data;
      
      // Check if user is in the match chat
      if (matchRooms.has(socket.userId) && matchRooms.get(socket.userId).has(matchId)) {
        const roomName = `match_chat_${matchId}`;
        socket.to(roomName).emit('match_user_typing', {
          userId: socket.userId,
          username: socket.username,
          matchId: matchId,
          isTyping: isTyping
        });
      }
    });

    // Subscribe to match updates
    socket.on('subscribe_match_updates', (data) => {
      const { matchId } = data;
      const roomName = `match_updates_${matchId}`;
      socket.join(roomName);
      console.log(`🔄 User ${socket.userId} subscribed to match updates ${matchId}`);
    });

    // ============ PRIVATE MESSAGES ============
    socket.on('private_message', async (data) => {
      try {
        const { to, message, tempId } = data;
        
        console.log('📤 Socket.io: Private message from', socket.userId, 'to', to);
        
        // Validate data
        if (!to || !message) {
          console.error('Invalid message data:', data);
          return;
        }
        
        // Save message to database
        const [result] = await db.execute(
          'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
          [socket.userId, to, message]
        );
        
        // Get sender info
        const [sender] = await db.execute(
          'SELECT username, profile_pic FROM users WHERE id = ?',
          [socket.userId]
        );
        
        const messageData = {
          id: result.insertId,
          sender_id: socket.userId,
          sender_username: sender[0]?.username || socket.username,
          sender_profile_pic: sender[0]?.profile_pic,
          receiver_id: to,
          message: message,
          created_at: new Date(),
          read_status: 0,
          tempId: tempId
        };
        
        // Send to recipient if online
        const recipientSocketId = onlineUsers.get(to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new_message', messageData);
        }
        
        // Send confirmation to sender
        socket.emit('message_sent', { 
          messageId: result.insertId, 
          tempId: tempId 
        });
        
      } catch (error) {
        console.error('Error sending private message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // ============ TYPING INDICATOR ============
    socket.on('typing', (data) => {
      const { to, isTyping } = data;
      const recipientSocketId = onlineUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
          isTyping: isTyping
        });
      }
    });
    
    // ============ JOIN USER ROOM ============
    socket.on('join_user', (data) => {
      console.log(`👤 User ${socket.userId} joining personal room`);
      // Already joined above
    });
    
    // ============ DISCONNECT HANDLER ============
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket.io: User disconnected: ${socket.username} (ID: ${socket.userId})`);
      
      if (socket.userId) {
        // Remove user from all match chat rooms
        if (matchRooms.has(socket.userId)) {
          const userMatches = matchRooms.get(socket.userId);
          userMatches.forEach(matchId => {
            const roomName = `match_chat_${matchId}`;
            socket.to(roomName).emit('user_left_chat', {
              userId: socket.userId,
              username: socket.username,
              matchId: matchId,
              reason: 'disconnected'
            });
          });
          matchRooms.delete(socket.userId);
        }
        
        // Remove from online users
        onlineUsers.delete(socket.userId);
        userConnections.delete(socket.userId);
        
        // Notify friends that user is offline
        await notifyFriendsOnlineStatus(socket.userId, false, socket.username);
        
        // Notify others
        socket.broadcast.emit('friend_status_change', {
          userId: socket.userId,
          username: socket.username,
          isOnline: false
        });
      }
    });
    
    // ============ HEARTBEAT ============
    socket.on('heartbeat', () => {
      socket.emit('heartbeat_response');
    });
    
    // ============ MESSAGE READ ============
    socket.on('message_read', async (data) => {
      try {
        const { messageId } = data;
        await db.execute(
          'UPDATE messages SET read_status = 1 WHERE id = ?',
          [messageId]
        );
        
        // Notify sender
        const [message] = await db.execute(
          'SELECT sender_id FROM messages WHERE id = ?',
          [messageId]
        );
        
        if (message.length > 0) {
          const senderSocketId = onlineUsers.get(message[0].sender_id);
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_read_confirmation', {
              messageId: messageId
            });
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // ============ MATCH UPDATES ============
    socket.on('match_update', (data) => {
      const { matchId, update } = data;
      const roomName = `match_updates_${matchId}`;
      
      io.to(roomName).emit('match_updated', {
        matchId: matchId,
        update: update
      });
      
      // Also notify match chat room if it's a status change
      if (update.status) {
        const matchChatRoom = `match_chat_${matchId}`;
        const systemMessage = getMatchStatusSystemMessage(update.status);
        
        if (systemMessage) {
          io.to(matchChatRoom).emit('match_system_message', {
            matchId: matchId,
            message: systemMessage,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });
};

// Helper function to save match chat messages (async)
const saveMatchChatMessage = async (matchId, userId, message) => {
  try {
    await db.execute(
      `INSERT INTO match_chat_messages (match_id, user_id, message) 
       VALUES (?, ?, ?)`,
      [matchId, userId, message]
    );
    console.log(`💾 Match chat message saved for match ${matchId}`);
  } catch (error) {
    console.error('Error saving match chat message:', error);
  }
};

// Helper function to get system messages for match status changes
const getMatchStatusSystemMessage = (status) => {
  switch(status) {
    case 'ongoing':
      return 'Match has started! Good luck to both players!';
    case 'completed':
      return 'Match has been completed!';
    case 'disputed':
      return 'Match is under dispute. Admin review required.';
    case 'cancelled':
      return 'Match has been cancelled.';
    default:
      return null;
  }
};

// Helper function to notify friends about online status
const notifyFriendsOnlineStatus = async (userId, isOnline, username = '') => {
  try {
    // Check if userId is valid
    if (!userId) {
      console.error('❌ notifyFriendsOnlineStatus: userId is undefined');
      return;
    }

    // Get user's friends - FIXED QUERY
    const [friends] = await db.execute(`
      SELECT DISTINCT 
        CASE 
          WHEN f.user_id = ? THEN f.friend_id 
          ELSE f.user_id 
        END as friendId
      FROM friends f
      WHERE (f.user_id = ? OR f.friend_id = ?) 
        AND f.status = 'accepted'
    `, [userId, userId, userId]);
    
    console.log(`👥 Notifying ${friends.length} friends about user ${userId} (${username})`);
    
    // Notify each online friend
    friends.forEach(friend => {
      const friendSocketId = onlineUsers.get(friend.friendId);
      if (friendSocketId && ioInstance) {
        ioInstance.to(friendSocketId).emit('friend_status_change', {
          userId: userId,
          username: username,
          isOnline: isOnline
        });
      }
    });
  } catch (error) {
    console.error('Error notifying friends:', error);
  }
};

// Export a function to send match updates
const sendMatchUpdate = (matchId, update) => {
  if (!ioInstance) return;
  
  const roomName = `match_updates_${matchId}`;
  const matchChatRoom = `match_chat_${matchId}`;
  
  // Send to match updates room
  ioInstance.to(roomName).emit('match_updated', {
    matchId: matchId,
    update: update
  });
  
  // Send system message to match chat
  if (update.status) {
    const systemMessage = getMatchStatusSystemMessage(update.status);
    if (systemMessage) {
      ioInstance.to(matchChatRoom).emit('match_system_message', {
        matchId: matchId,
        message: systemMessage,
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = { 
  initializeSocket,
  sendMatchUpdate 
};