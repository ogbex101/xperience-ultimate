const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get chat history with a user
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;
    
    // Verify friendship
    const [friendship] = await db.execute(`
      SELECT * FROM friends 
      WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
        AND status = 'accepted'
    `, [userId, otherUserId, otherUserId, userId]);
    
    if (friendship.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only chat with friends' 
      });
    }
    
    // Get messages
    const [messages] = await db.execute(`
      SELECT 
        m.*,
        u_sender.username as sender_username,
        u_sender.profile_pic as sender_profile_pic
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
      LIMIT 100
    `, [userId, otherUserId, otherUserId, userId]);
    
    // Mark messages as read
    await db.execute(`
      UPDATE messages 
      SET read_status = 1 
      WHERE receiver_id = ? AND sender_id = ? AND read_status = 0
    `, [userId, otherUserId]);
    
    res.json({ success: true, messages });
    
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching chat history' 
    });
  }
});

// Send message (REST API endpoint - Socket.io handles real-time)
router.post('/send', async (req, res) => {
  try {
    const { receiverId, groupId, message } = req.body;
    const senderId = req.user.id;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Message cannot be empty' 
      });
    }
    
    if (receiverId) {
      // Private message - verify friendship
      const [friendship] = await db.execute(`
        SELECT * FROM friends 
        WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
          AND status = 'accepted'
      `, [senderId, receiverId, receiverId, senderId]);
      
      if (friendship.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only chat with friends' 
        });
      }
    }
    
    // Save message to database (Socket.io will handle real-time delivery)
    const [result] = await db.execute(
      'INSERT INTO messages (sender_id, receiver_id, group_id, message, message_type) VALUES (?, ?, ?, ?, ?)',
      [
        senderId, 
        receiverId || null, 
        groupId || null, 
        message.trim(),
        groupId ? 'group' : 'private'
      ]
    );
    
    // Get the saved message
    const [savedMessage] = await db.execute(`
      SELECT m.*, u.username as sender_username, u.profile_pic as sender_profile_pic
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [result.insertId]);
    
    res.json({ 
      success: true, 
      message: savedMessage[0],
      messageId: result.insertId
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending message' 
    });
  }
});

// Get recent conversations
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get last message from each conversation
    const [conversations] = await db.execute(`
      SELECT 
        other_user.id as other_user_id,
        other_user.username as other_user_username,
        other_user.profile_pic,
        other_user.rank,
        last_message.message as last_message,
        last_message.created_at as last_message_time,
        unread_count.count as unread_count
      FROM (
        SELECT 
          CASE 
            WHEN m.sender_id = ? THEN m.receiver_id
            ELSE m.sender_id
          END as other_user_id,
          MAX(m.created_at) as last_msg_time
        FROM messages m
        WHERE (m.sender_id = ? OR m.receiver_id = ?)
          AND m.message_type = 'private'
          AND (m.group_id IS NULL OR m.group_id = 0)
        GROUP BY other_user_id
      ) recent
      JOIN users other_user ON recent.other_user_id = other_user.id
      LEFT JOIN messages last_message ON (
        ((last_message.sender_id = ? AND last_message.receiver_id = other_user.id)
         OR (last_message.sender_id = other_user.id AND last_message.receiver_id = ?))
        AND last_message.created_at = recent.last_msg_time
      )
      LEFT JOIN (
        SELECT 
          sender_id,
          COUNT(*) as count
        FROM messages
        WHERE receiver_id = ? 
          AND read_status = 0
          AND message_type = 'private'
        GROUP BY sender_id
      ) unread_count ON unread_count.sender_id = other_user.id
      ORDER BY recent.last_msg_time DESC
    `, [userId, userId, userId, userId, userId, userId]);
    
    res.json({ success: true, conversations });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching conversations' 
    });
  }
});

// In routes/chat.js - UPDATE THE getGroupConversations route
router.get('/group-conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // FIXED SQL QUERY - no correlation in subquery
    const [groups] = await db.execute(`
      SELECT 
        g.id as group_id,
        g.name as group_name,
        g.game_specialty,
        g.description,
        g.created_at,
        (
          SELECT m.message 
          FROM messages m 
          WHERE m.group_id = g.id 
            AND m.message_type = 'group'
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT m.created_at 
          FROM messages m 
          WHERE m.group_id = g.id 
            AND m.message_type = 'group'
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages m2
          WHERE m2.group_id = g.id
            AND m2.read_status = 0
            AND m2.message_type = 'group'
            AND m2.sender_id != ?
        ) as unread_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ? 
        AND gm.status = 'joined'
      GROUP BY g.id
      ORDER BY last_message_time DESC
    `, [userId, userId]);
    
    res.json({ success: true, groups });
    
  } catch (error) {
    console.error('Error fetching group conversations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching group conversations',
      error: error.message
    });
  }
});

// Mark messages as read
router.post('/mark-read', async (req, res) => {
  try {
    const { senderId, groupId } = req.body;
    const userId = req.user.id;
    
    if (senderId) {
      await db.execute(`
        UPDATE messages 
        SET read_status = 1 
        WHERE receiver_id = ? AND sender_id = ? AND read_status = 0
      `, [userId, senderId]);
    } else if (groupId) {
      await db.execute(`
        UPDATE messages 
        SET read_status = 1 
        WHERE group_id = ? AND receiver_id = ? AND read_status = 0
      `, [groupId, userId]);
    }
    
    res.json({ success: true, message: 'Messages marked as read' });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error marking messages as read' 
    });
  }
});

// Get group chat history
router.get('/group/:groupId/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    
    // Verify group membership
    const [membership] = await db.execute(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND status = "joined"',
      [groupId, userId]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a member of this group' 
      });
    }
    
    // Get group messages
    const [messages] = await db.execute(`
      SELECT 
        m.*,
        u.username as sender_username,
        u.profile_pic as sender_profile_pic
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.group_id = ? AND m.message_type = 'group'
      ORDER BY m.created_at ASC
      LIMIT 200
    `, [groupId]);
    
    // Mark messages as read for this user
    await db.execute(`
      UPDATE messages 
      SET read_status = 1 
      WHERE group_id = ? AND receiver_id = ? AND read_status = 0
    `, [groupId, userId]);
    
    res.json({ success: true, messages });
    
  } catch (error) {
    console.error('Error fetching group chat history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching group chat history' 
    });
  }
});

module.exports = router;