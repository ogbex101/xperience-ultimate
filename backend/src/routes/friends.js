const express = require('express');
const router = express.Router();
const db = require('../config/database');

// In backend/routes/friend.js - UPDATE getFriends route
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [friends] = await db.execute(`
      SELECT 
        u.id, 
        u.username, 
        u.profile_pic, 
        u.rank,
        u.wins,
        u.losses,
        u.matches_played,
        u.win_rate,
        u.balance,
        u.account_status,
        f.status,
        f.is_favorite,
        f.created_at as friends_since,
        'offline' as online_status
      FROM friends f
      JOIN users u ON (
        (f.user_id = ? AND f.friend_id = u.id) OR 
        (f.friend_id = ? AND f.user_id = u.id)
      )
      WHERE f.status = 'accepted'
        AND u.account_status = 'active'
      ORDER BY 
        f.is_favorite DESC,
        CASE u.rank
          WHEN 'SSS' THEN 1
          WHEN 'SS' THEN 2
          WHEN 'S' THEN 3
          WHEN 'A' THEN 4
          WHEN 'B' THEN 5
          WHEN 'C' THEN 6
          WHEN 'D' THEN 7
          WHEN 'E' THEN 8
          ELSE 9
        END,
        u.username
    `, [userId, userId]);
    
    // Get friend requests
    const [requests] = await db.execute(`
      SELECT 
        f.id as request_id,
        u.id as user_id,
        u.username, 
        u.profile_pic, 
        u.rank,
        u.win_rate,
        f.created_at
      FROM friends f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);
    
    // Enhance friends with online status (you'll need to integrate with your socket system)
    const enhancedFriends = friends.map(friend => ({
      ...friend,
      win_rate: parseFloat(friend.win_rate) || 0,
      profile_pic: friend.profile_pic || 'default.png',
      // Add actual online status from your socket system here
      status: friend.online_status
    }));
    
    res.json({
      success: true,
      friends: enhancedFriends,
      requests: requests
    });
    
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching friends list' 
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;
    
    // Allow empty query to get random users for suggestions
    if (!query || query.trim() === '') {
      // Return random active users (not current user, not already friends)
      const [users] = await db.execute(`
        SELECT 
          u.id, 
          u.username, 
          u.profile_pic, 
          u.rank,
          u.win_rate,
          u.wins,
          u.losses,
          u.matches_played,
          u.balance,
          u.is_admin,
          u.created_at,
          u.account_status,
          f.status as friend_status,
          'offline' as status -- Default status, you can enhance this with socket data
        FROM users u
        LEFT JOIN friends f ON (
          (f.user_id = ? AND f.friend_id = u.id) OR 
          (f.friend_id = ? AND f.user_id = u.id)
        )
        WHERE u.id != ?
          AND u.account_status = 'active'
          AND (u.is_banned = 0 OR u.is_banned IS NULL)
        ORDER BY RAND()
        LIMIT 20
      `, [userId, userId, userId]);
      
      return res.json({ 
        success: true, 
        results: users.map(user => ({
          ...user,
          profile_pic: user.profile_pic || 'default.png',
          win_rate: parseFloat(user.win_rate) || 0
        }))
      });
    }
    
    // Search with query
    const [users] = await db.execute(`
      SELECT 
        u.id, 
        u.username, 
        u.profile_pic, 
        u.rank,
        u.win_rate,
        u.wins,
        u.losses,
        u.matches_played,
        u.balance,
        u.is_admin,
        u.created_at,
        u.account_status,
        f.status as friend_status,
        'offline' as status
      FROM users u
      LEFT JOIN friends f ON (
        (f.user_id = ? AND f.friend_id = u.id) OR 
        (f.friend_id = ? AND f.user_id = u.id)
      )
      WHERE (u.username LIKE ? OR u.rank LIKE ?)
        AND u.id != ?
        AND u.account_status = 'active'
        AND (u.is_banned = 0 OR u.is_banned IS NULL)
      ORDER BY 
        CASE u.rank
          WHEN 'SSS' THEN 1
          WHEN 'SS' THEN 2
          WHEN 'S' THEN 3
          WHEN 'A' THEN 4
          WHEN 'B' THEN 5
          WHEN 'C' THEN 6
          WHEN 'D' THEN 7
          WHEN 'E' THEN 8
          ELSE 9
        END,
        u.win_rate DESC,
        u.matches_played DESC
      LIMIT 50
    `, [userId, userId, `%${query}%`, `%${query}%`, userId]);
    
    res.json({ 
      success: true, 
      results: users.map(user => ({
        ...user,
        profile_pic: user.profile_pic || 'default.png',
        win_rate: parseFloat(user.win_rate) || 0
      }))
    });
    
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching users' 
    });
  }
});

// Send friend request
router.post('/send-request', async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;
    
    // Check if user exists
    const [user] = await db.execute(
      'SELECT id FROM users WHERE id = ? AND (is_banned = 0 OR is_banned IS NULL)',
      [friendId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if already friends or request exists
    const [existing] = await db.execute(`
      SELECT * FROM friends 
      WHERE (user_id = ? AND friend_id = ?) 
         OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);
    
    if (existing.length > 0) {
      const status = existing[0].status;
      if (status === 'accepted') {
        return res.status(400).json({ 
          success: false, 
          message: 'You are already friends with this user' 
        });
      } else if (status === 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: 'Friend request already sent' 
        });
      } else if (status === 'blocked') {
        return res.status(400).json({ 
          success: false, 
          message: 'This user has been blocked' 
        });
      }
    }
    
    // Send friend request
    await db.execute(
      'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, "pending")',
      [userId, friendId]
    );
    
    // Create notification
    await db.execute(
      'INSERT INTO notifications (user_id, sender_id, message, type, status) VALUES (?, ?, ?, "invite", "unread")',
      [friendId, userId, `${req.user.username} sent you a friend request`]
    );
    
    res.json({ 
      success: true, 
      message: 'Friend request sent successfully' 
    });
    
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending friend request' 
    });
  }
});

// Accept friend request
router.post('/accept-request', async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.body;
    
    // Get the friend request
    const [request] = await db.execute(
      'SELECT * FROM friends WHERE id = ? AND friend_id = ? AND status = "pending"',
      [requestId, userId]
    );
    
    if (request.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Friend request not found' 
      });
    }
    
    // Accept the request
    await db.execute(
      'UPDATE friends SET status = "accepted" WHERE id = ?',
      [requestId]
    );
    
    // Create notification for the requester
    await db.execute(
      'INSERT INTO notifications (user_id, sender_id, message, type, status) VALUES (?, ?, ?, "system", "unread")',
      [request[0].user_id, userId, `${req.user.username} accepted your friend request`]
    );
    
    res.json({ 
      success: true, 
      message: 'Friend request accepted' 
    });
    
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error accepting friend request' 
    });
  }
});

// Reject/Delete friend request
router.delete('/requests/:requestId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    
    await db.execute(
      'DELETE FROM friends WHERE id = ? AND friend_id = ?',
      [requestId, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Friend request removed' 
    });
    
  } catch (error) {
    console.error('Error removing friend request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error removing friend request' 
    });
  }
});

// Remove friend
router.delete('/:friendId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    
    await db.execute(`
      DELETE FROM friends 
      WHERE (user_id = ? AND friend_id = ?) 
         OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);
    
    res.json({ 
      success: true, 
      message: 'Friend removed successfully' 
    });
    
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error removing friend' 
    });
  }
});

// Block user
router.post('/block', async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;
    
    // Check if relationship exists
    const [existing] = await db.execute(`
      SELECT * FROM friends 
      WHERE (user_id = ? AND friend_id = ?) 
         OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);
    
    if (existing.length > 0) {
      // Update existing relationship
      await db.execute(`
        UPDATE friends 
        SET status = 'blocked' 
        WHERE (user_id = ? AND friend_id = ?) 
           OR (user_id = ? AND friend_id = ?)
      `, [userId, friendId, friendId, userId]);
    } else {
      // Create new blocked relationship
      await db.execute(
        'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, "blocked")',
        [userId, friendId]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'User blocked successfully' 
    });
    
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error blocking user' 
    });
  }
});
// Get online friends
router.get('/online', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [friends] = await db.execute(`
      SELECT 
        u.id, 
        u.username, 
        u.profile_pic, 
        u.rank,
        u.wins,
        u.losses,
        u.win_rate,
        'online' as status
      FROM friends f
      JOIN users u ON (
        (f.user_id = ? AND f.friend_id = u.id) OR 
        (f.friend_id = ? AND f.user_id = u.id)
      )
      WHERE f.status = 'accepted'
      ORDER BY u.username
    `, [userId, userId]);
    
    res.json({ success: true, friends });
    
  } catch (error) {
    console.error('Error fetching online friends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching online friends' 
    });
  }
});

// Get friend requests only
router.get('/requests', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [requests] = await db.execute(`
      SELECT 
        f.id as request_id,
        u.id as user_id,
        u.username, 
        u.profile_pic, 
        u.rank,
        f.created_at
      FROM friends f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);
    
    res.json({ success: true, requests });
    
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching friend requests' 
    });
  }
});

// Update user online status
router.post('/update-status', async (req, res) => {
  try {
    const userId = req.user.id;
    const { is_online } = req.body;
    
    // This would typically update a users table column
    // For now, we'll just acknowledge
    res.json({ 
      success: true, 
      message: 'Status updated',
      is_online: is_online 
    });
    
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating status' 
    });
  }
});
// Add this route for getting online status
router.get('/online-count', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [friends] = await db.execute(`
      SELECT 
        u.id, 
        u.username,
        u.rank,
        u.profile_pic,
        u.win_rate
      FROM friends f
      JOIN users u ON (
        (f.user_id = ? AND f.friend_id = u.id) OR 
        (f.friend_id = ? AND f.user_id = u.id)
      )
      WHERE f.status = 'accepted'
      ORDER BY u.username
    `, [userId, userId]);
    
    // This would ideally check actual online status from socket
    // For now, we'll return all friends and frontend will filter with socket data
    res.json({ 
      success: true, 
      friends: friends,
      count: friends.length
    });
    
  } catch (error) {
    console.error('Error fetching friends count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching friends' 
    });
  }
});

module.exports = router;