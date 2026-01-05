const db = require('../config/database');

class NotificationService {
  /**
   * Create a notification
   */
 // In notificationService.js - FIXED createNotification function
static async createNotification({
  userId,
  senderId = null,
  message,
  type = 'system', // Must be one of: 'invite', 'message', 'system', 'match', 'tournament', etc.
  matchId = null,
  tournamentId = null
}) {
  try {
    console.log(`📨 Creating ${type} notification for user ${userId}: ${message}`);
    
    // Use only columns that exist in your table
    const [result] = await db.execute(
      `INSERT INTO notifications 
       (user_id, sender_id, message, type, match_id, tournament_id, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'unread', NOW())`,
      [userId, senderId, message, type, matchId, tournamentId]
    );
    
    return {
      success: true,
      id: result.insertId,
      message: 'Notification created'
    };
  } catch (error) {
    console.error('❌ Notification creation failed:', error);
    return { success: false, error: error.message };
  }
}
  /**
   * Create match-related notifications
   */
  // ENHANCE your existing createMatchNotification method:
static async createMatchNotification(userId, senderId, matchId, action, data = {}) {
  try {
    console.log(`🎮 Match notification: ${action} for match ${matchId}`);
    
    // Get match details for better messages
    const [matches] = await db.execute(
      `SELECT m.*, 
              p1.username as player1_username,
              p2.username as player2_username
       FROM matches m
       LEFT JOIN users p1 ON m.player1_id = p1.id
       LEFT JOIN users p2 ON m.player2_id = p2.id
       WHERE m.id = ?`,
      [matchId]
    );
    
    let message = '';
    let recipientId = userId;
    let finalSenderId = senderId;
    
    // Enhanced messages with match details
    if (matches.length > 0) {
      const match = matches[0];
      
      switch(action) {
        case 'created':
          message = `${data.senderName || 'Someone'} created a ${match.game} match challenge (₦${match.stake_amount})`;
          break;
        case 'joined':
          message = `${data.senderName || 'Someone'} joined your ${match.game} match!`;
          recipientId = match.player1_id; // Always notify creator when someone joins
          break;
        case 'completed':
          const winnerName = data.winnerName || 'Unknown';
          message = `🏆 ${winnerName} won your ${match.game} match! Prize: ₦${match.prize_pool_amount}`;
          finalSenderId = null; // System notification for completion
          break;
        case 'result_submitted':
          message = `${data.senderName || 'Opponent'} submitted results for your ${match.game} match. Please confirm.`;
          // Determine who should get this notification (the other player)
          recipientId = senderId === match.player1_id ? match.player2_id : match.player1_id;
          break;
        case 'invitation':
          message = `${data.senderName || match.player1_username} challenged you to a ${match.game} match! Stake: ₦${match.stake_amount}`;
          break;
        case 'cancelled':
          message = `${data.senderName || match.player1_username} cancelled the ${match.game} match`;
          break;
        case 'disputed':
          message = `${data.senderName || 'Someone'} disputed the ${match.game} match results`;
          break;
        default:
          message = `${senderId ? '[Action] ' : ''}${action} on match`;
      }
    } else {
      // Fallback if match not found
      const messages = {
        created: '🎮 created a new match challenge',
        joined: '👥 joined your match',
        completed: '🏆 completed a match',
        result_submitted: '📝 submitted match results',
        invitation: '⚔️ challenged you to a match',
        cancelled: '❌ cancelled a match',
        disputed: '⚠️ disputed match results'
      };
      
      message = `${senderId ? '[Sender] ' : ''}${messages[action] || action}`;
    }
    
    // If recipientId is not valid, don't create notification
    if (!recipientId) {
      console.error(`❌ No valid recipient for match notification: match=${matchId}, action=${action}`);
      return { success: false, error: 'No recipient specified' };
    }
    
    return await this.createNotification({
      userId: recipientId,
      senderId: finalSenderId,
      message,
      type: 'match',
      matchId
    });
    
  } catch (error) {
    console.error(`❌ Error in createMatchNotification:`, error);
    return { success: false, error: error.message };
  }
}

// ADD this helper method for notifying both players:
static async notifyBothMatchPlayers(matchId, message, data = {}) {
  try {
    // Get both players from match
    const [matches] = await db.execute(
      'SELECT player1_id, player2_id FROM matches WHERE id = ?',
      [matchId]
    );
    
    if (matches.length === 0) {
      return { success: false, error: 'Match not found' };
    }
    
    const match = matches[0];
    const players = [match.player1_id, match.player2_id].filter(id => id);
    
    const results = [];
    for (const playerId of players) {
      const result = await this.createNotification({
        userId: playerId,
        message: message,
        type: 'match',
        matchId: matchId
      });
      results.push(result);
    }
    
    return { success: true, results };
    
  } catch (error) {
    console.error('Error notifying both players:', error);
    return { success: false, error: error.message };
  }
}

  /**
   * Create tournament notifications
   */
  static async createTournamentNotification(userId, senderId, tournamentId, action, data = {}) {
    const messages = {
      created: '🏟️ created a new tournament',
      joined: '🎯 joined your tournament',
      started: '🚀 tournament has started',
      completed: '🏅 tournament completed',
      winner: '👑 won the tournament',
      invitation: '📨 invited you to join a tournament'
    };
    
    let message = `${senderId ? '[Sender] ' : ''}${messages[action]}`;
    if (data.prize) {
      message += ` and won ₦${data.prize}`;
    }
    
    return this.createNotification({
      userId,
      senderId,
      message,
      type: 'tournament',
      tournamentId
    });
  }

  /**
   * Create friend notifications
   */
  static async createFriendNotification(userId, senderId, action) {
    const messages = {
      request_sent: '🤝 sent you a friend request',
      request_accepted: '✅ accepted your friend request',
      request_declined: '❌ declined your friend request'
    };
    
    return this.createNotification({
      userId,
      senderId,
      message: `[Sender] ${messages[action]}`,
      type: 'friend',
      friendRequestId: senderId
    });
  }

  /**
   * Create chat notifications
   */
  static async createChatNotification(userId, senderId, action, data = {}) {
    const messages = {
      message_received: `💬 sent you a message: "${data.message?.substring(0, 50)}..."`,
      group_message: `👥 sent a message in ${data.groupName || 'group'}`,
      mention: `👋 mentioned you in ${data.context || 'chat'}`
    };
    
    return this.createNotification({
      userId,
      senderId,
      message: `[Sender] ${messages[action]}`,
      type: 'chat',
      groupId: data.groupId || null
    });
  }

  /**
   * Create wallet/transaction notifications
   */
  static async createTransactionNotification(userId, transactionId, action, amount, currency = 'NGN') {
    const messages = {
      deposit: `💰 Deposit successful: ${currency} ${amount}`,
      withdrawal: `💳 Withdrawal requested: ${currency} ${amount}`,
      transfer_received: `🔄 Received transfer: ${currency} ${amount}`,
      transfer_sent: `🔄 Transfer sent: ${currency} ${amount}`,
      conversion_xp: `✨ Converted to XP: ${currency} ${amount}`
    };
    
    return this.createNotification({
      userId,
      message: messages[action],
      type: 'transaction',
      transactionId
    });
  }

  /**
   * Create group notifications
   */
  static async createGroupNotification(userId, senderId, groupId, action, data = {}) {
    const messages = {
      joined: '👤 joined the group',
      left: '👋 left the group',
      invited: '📨 invited you to join a group',
      promoted: '⭐ promoted to admin',
      demoted: '📉 demoted from admin',
      removed: '🚫 removed from group'
    };
    
    return this.createNotification({
      userId,
      senderId,
      message: `[Sender] ${messages[action]} ${data.groupName ? `"${data.groupName}"` : ''}`,
      type: 'group',
      groupId
    });
  }

  /**
   * Create system notifications
   */
  static async createSystemNotification(userId, message, data = {}) {
    return this.createNotification({
      userId,
      message: `⚙️ ${message}`,
      type: 'system',
      ...data
    });
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(userId, filters = {}) {
    try {
      let query = `
        SELECT n.*, 
               u.username as sender_username,
               u.profile_pic as sender_profile_pic,
               u.rank as sender_rank
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.user_id = ?
      `;
      
      const params = [userId];
      
      // Apply filters
      if (filters.type) {
        query += ' AND n.type = ?';
        params.push(filters.type);
      }
      
      if (filters.status) {
        query += ' AND n.status = ?';
        params.push(filters.status);
      }
      
      // Sorting
      query += ' ORDER BY n.created_at DESC';
      
      // Pagination
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
      
      const [notifications] = await db.execute(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
      const countParams = [userId];
      
      if (filters.type) {
        countQuery += ' AND type = ?';
        countParams.push(filters.type);
      }
      
      const [countResult] = await db.execute(countQuery, countParams);
      
      return {
        success: true,
        notifications,
        total: countResult[0].total
      };
    } catch (error) {
      console.error('Get user notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const [result] = await db.execute(
        "UPDATE notifications SET status = 'read', read_at = NOW() WHERE id = ? AND user_id = ?",
        [notificationId, userId]
      );
      
      return {
        success: result.affectedRows > 0,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    try {
      const [result] = await db.execute(
        "UPDATE notifications SET status = 'read', read_at = NOW() WHERE user_id = ? AND status = 'unread'",
        [userId]
      );
      
      return {
        success: true,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('Mark all as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread counts
   */
  static async getUnreadCounts(userId) {
    try {
      const [counts] = await db.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN type = 'match' THEN 1 ELSE 0 END) as matches,
          SUM(CASE WHEN type = 'tournament' THEN 1 ELSE 0 END) as tournaments,
          SUM(CASE WHEN type = 'friend' THEN 1 ELSE 0 END) as friends,
          SUM(CASE WHEN type = 'chat' THEN 1 ELSE 0 END) as chats,
          SUM(CASE WHEN type = 'transaction' THEN 1 ELSE 0 END) as transactions,
          SUM(CASE WHEN type = 'group' THEN 1 ELSE 0 END) as groups,
          SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system
        FROM notifications 
        WHERE user_id = ? AND status = 'unread'
      `, [userId]);
      
      return {
        success: true,
        counts: counts[0] || {
          total: 0, matches: 0, tournaments: 0, friends: 0,
          chats: 0, transactions: 0, groups: 0, system: 0
        }
      };
    } catch (error) {
      console.error('Get unread counts error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = NotificationService;