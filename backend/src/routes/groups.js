const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeGroup, isGroupMember } = require('../middleware/auth');

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if user has permission to view group details
 */
async function canViewGroup(userId, groupId) {
  const [group] = await db.query(
    'SELECT visibility FROM groups WHERE id = ?',
    [groupId]
  );
  
  if (group.length === 0) return false;
  
  // Public groups can be viewed by anyone
  if (group[0].visibility === 'public') return true;
  
  // Private groups require membership
  const [member] = await db.query(
    'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = "joined"',
    [groupId, userId]
  );
  
  return member.length > 0;
}

/**
 * Get user's role in group
 */
async function getUserGroupRole(userId, groupId) {
  if (!userId) return null;
  
  // Check if user is creator (owner)
  const [group] = await db.query(
    'SELECT creator_id FROM groups WHERE id = ?',
    [groupId]
  );
  
  if (group.length > 0 && group[0].creator_id === userId) {
    return 'owner';
  }
  
  // Check membership role
  const [membership] = await db.query(
    'SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = "joined"',
    [groupId, userId]
  );
  
  return membership.length > 0 ? membership[0].role : null;
}

/**
 * Check group capacity
 */
async function checkGroupCapacity(groupId) {
  const [currentMembers] = await db.query(
    'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND status = "joined"',
    [groupId]
  );
  
  const [groupCapacity] = await db.query(
    'SELECT max_members FROM groups WHERE id = ?',
    [groupId]
  );
  
  return {
    current: currentMembers[0].count,
    max: groupCapacity[0].max_members,
    hasSpace: currentMembers[0].count < groupCapacity[0].max_members
  };
}

// ==================== PUBLIC ROUTES (NO AUTH REQUIRED) ====================

// Get popular groups (public only) - NO AUTH REQUIRED
router.get('/popular', async (req, res) => {
  try {
    const [groups] = await db.query(`
      SELECT 
        g.*,
        u.username as creator_name,
        (SELECT COUNT(*) FROM group_members gm 
         WHERE gm.group_id = g.id AND gm.status = 'joined') as member_count,
        false as is_member
      FROM groups g
      JOIN users u ON g.creator_id = u.id
      WHERE g.visibility = 'public'
      ORDER BY member_count DESC, g.created_at DESC
      LIMIT 10
    `);
    
    res.json({ success: true, groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Discover groups (public groups) - NO AUTH REQUIRED
router.get('/discover', async (req, res) => {
  try {
    // Get user ID from token if exists, otherwise use 0
    const token = req.headers.authorization?.split(' ')[1];
    let userId = 0;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.id;
      } catch (jwtError) {
        // Token invalid, treat as guest
        userId = 0;
      }
    }
    
    const query = userId > 0 ? `
      SELECT 
        g.*,
        u.username as creator_name,
        (SELECT COUNT(*) FROM group_members gm 
         WHERE gm.group_id = g.id AND gm.status = 'joined') as member_count,
        (SELECT COUNT(*) FROM group_tournaments gt 
         WHERE gt.group_id = g.id) as tournament_participations,
        (SELECT COUNT(*) FROM tournaments t 
         WHERE t.group_id = g.id AND t.status = 'completed' 
         AND (t.winner_id IN (SELECT user_id FROM group_members WHERE group_id = g.id)
              OR t.group_id = g.id)) as tournament_wins
      FROM groups g
      JOIN users u ON g.creator_id = u.id
      WHERE g.visibility = 'public'
      AND g.id NOT IN (
        SELECT group_id FROM group_members 
        WHERE user_id = ? AND status IN ('joined', 'requested')
      )
      ORDER BY 
        (tournament_wins * 3 + tournament_participations * 2 + member_count) DESC,
        g.created_at DESC
      LIMIT 20
    ` : `
      SELECT 
        g.*,
        u.username as creator_name,
        (SELECT COUNT(*) FROM group_members gm 
         WHERE gm.group_id = g.id AND gm.status = 'joined') as member_count,
        (SELECT COUNT(*) FROM group_tournaments gt 
         WHERE gt.group_id = g.id) as tournament_participations,
        (SELECT COUNT(*) FROM tournaments t 
         WHERE t.group_id = g.id AND t.status = 'completed' 
         AND (t.winner_id IN (SELECT user_id FROM group_members WHERE group_id = g.id)
              OR t.group_id = g.id)) as tournament_wins
      FROM groups g
      JOIN users u ON g.creator_id = u.id
      WHERE g.visibility = 'public'
      ORDER BY member_count DESC, g.created_at DESC
      LIMIT 20
    `;
    
    const [groups] = await db.query(query, userId > 0 ? [userId] : []);
    
    res.json({ success: true, groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== ROUTES WITH AUTHORIZATION ====================

// Create a new group
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, game_specialty, description, max_members = 20, visibility = 'public' } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO groups (name, creator_id, game_specialty, description, max_members, visibility) VALUES (?, ?, ?, ?, ?, ?)',
      [name, req.user.id, game_specialty, description, max_members, visibility]
    );
    
    // Add creator as admin
    await db.query(
      'INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, "admin", "joined")',
      [result.insertId, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Group created successfully',
      group_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's groups
router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const [groups] = await db.query(`
      SELECT 
        g.*, 
        gm.role, 
        gm.status,
        (SELECT COUNT(*) FROM group_members gm2 
         WHERE gm2.group_id = g.id AND gm2.status = 'joined') as member_count,
        (SELECT COUNT(*) FROM group_tournaments gt 
         WHERE gt.group_id = g.id) as tournament_count,
        (SELECT COUNT(*) FROM tournaments t 
         WHERE t.group_id = g.id AND t.status = 'completed' 
         AND (t.winner_id IN (SELECT user_id FROM group_members WHERE group_id = g.id) 
              OR t.group_id = g.id)) as win_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ? AND gm.status = 'joined'
      ORDER BY g.created_at DESC
    `, [req.user.id]);
    
    res.json({ success: true, groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get group details - PROTECTED
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Check if user can view this group
    const canView = await canViewGroup(userId, groupId);
    if (!canView) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You do not have permission to view this group' 
      });
    }
    
    const [group] = await db.query(
      'SELECT * FROM groups WHERE id = ?',
      [groupId]
    );
    
    if (group.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Get members - only if user is a member
    let members = [];
    const userRole = await getUserGroupRole(userId, groupId);
    
    if (userRole) {
      const [memberData] = await db.query(`
        SELECT gm.*, u.username, u.profile_pic, u.rank
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ? AND gm.status = 'joined'
        ORDER BY 
          CASE gm.role 
            WHEN 'admin' THEN 1 
            ELSE 2 
          END,
          gm.created_at
      `, [groupId]);
      members = memberData;
    }
    
    // Get tournament stats
    const [tournamentStats] = await db.query(`
      SELECT 
        COUNT(*) as total_participations,
        SUM(CASE WHEN t.status = 'completed' AND 
          (t.winner_id IN (SELECT user_id FROM group_members WHERE group_id = ?) 
            OR t.group_id = ?) THEN 1 ELSE 0 END) as wins
      FROM group_tournaments gt
      LEFT JOIN tournaments t ON gt.tournament_id = t.id
      WHERE gt.group_id = ?
    `, [groupId, groupId, groupId]);
    
    res.json({ 
      success: true, 
      group: { 
        ...group[0], 
        tournament_participations: tournamentStats[0].total_participations,
        tournament_wins: tournamentStats[0].wins || 0
      }, 
      members,
      userRole: userRole || 'none'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get group members - PROTECTED
router.get('/:groupId/members', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Check if user can view this group
    const canView = await canViewGroup(userId, groupId);
    if (!canView) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You do not have permission to view group members' 
      });
    }
    
    const [members] = await db.query(`
      SELECT gm.*, u.username, u.profile_pic, u.rank
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ? AND gm.status = 'joined'
      ORDER BY 
        CASE gm.role 
          WHEN 'admin' THEN 1 
          ELSE 2 
        END,
        gm.created_at
    `, [groupId]);
    
    res.json({ 
      success: true, 
      members,
      count: members.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check group access (for frontend pre-check)
router.get('/:groupId/check-access', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    const canView = await canViewGroup(userId, groupId);
    
    if (!canView) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.json({ 
      success: true, 
      hasAccess: true,
      role: await getUserGroupRole(userId, groupId)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Request to join group
router.post('/:groupId/request', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Check if group exists and is public
    const [group] = await db.query(
      'SELECT id, name, visibility FROM groups WHERE id = ?',
      [groupId]
    );
    
    if (group.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }
    
    if (group[0].visibility === 'private') {
      return res.status(403).json({ 
        success: false, 
        message: 'This is a private group. You need an invitation to join.' 
      });
    }
    
    // Check if already a member or has pending request
    const [existing] = await db.query(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: existing[0].status === 'joined' 
          ? 'You are already a member of this group'
          : 'You already have a pending request to join this group'
      });
    }
    
    // Check group capacity
    const capacity = await checkGroupCapacity(groupId);
    if (!capacity.hasSpace) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group has reached maximum capacity' 
      });
    }
    
    // Create join request
    await db.query(
      'INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, "member", "requested")',
      [groupId, userId]
    );
    
    // Notify group admins
    const [admins] = await db.query(
      'SELECT user_id FROM group_members WHERE group_id = ? AND role = "admin" AND status = "joined"',
      [groupId]
    );
    
    for (const admin of admins) {
      await db.query(
        'INSERT INTO notifications (user_id, sender_id, message, type, status) VALUES (?, ?, ?, "group_join_request", "unread")',
        [admin.user_id, userId, `${req.user.username} has requested to join your group "${group[0].name}"`]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Join request sent. Waiting for admin approval.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Invite user to group - ADMIN ONLY
router.post('/:groupId/invite', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { username } = req.body;
    const userId = req.user.id;
    
    // Check if user is admin of the group
    const userRole = await getUserGroupRole(userId, groupId);
    if (!['admin', 'owner'].includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only group admins can invite users' 
      });
    }
    
    // First, find user by username
    const [users] = await db.query(
      'SELECT id, username FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const invitedUserId = users[0].id;
    
    // Check if user is already a member
    const [existing] = await db.query(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, invitedUserId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already a member or has a pending invitation' 
      });
    }
    
    // Check group capacity
    const capacity = await checkGroupCapacity(groupId);
    if (!capacity.hasSpace) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group has reached maximum capacity' 
      });
    }
    
    // Create invitation
    await db.query(
      'INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, "member", "invited")',
      [groupId, invitedUserId]
    );
    
    // Create notification
    await db.query(
      'INSERT INTO notifications (user_id, sender_id, message, type, status) VALUES (?, ?, ?, "invite", "unread")',
      [invitedUserId, userId, `${req.user.username} has invited you to join their group`]
    );
    
    res.json({ success: true, message: 'Invitation sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Join group (accept invitation)
router.post('/:groupId/join', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Check if invited
    const [invitation] = await db.query(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND status = "invited"',
      [groupId, userId]
    );
    
    if (invitation.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No invitation found for this group' 
      });
    }
    
    // Check group capacity
    const capacity = await checkGroupCapacity(groupId);
    if (!capacity.hasSpace) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group has reached maximum capacity' 
      });
    }
    
    // Update membership status
    await db.query(
      'UPDATE group_members SET status = "joined" WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    
    // Notify group admins
    const [admins] = await db.query(
      'SELECT user_id FROM group_members WHERE group_id = ? AND role = "admin" AND status = "joined"',
      [groupId]
    );
    
    for (const admin of admins) {
      await db.query(
        'INSERT INTO notifications (user_id, sender_id, message, type, status) VALUES (?, ?, ?, "system", "unread")',
        [admin.user_id, userId, `${req.user.username} has joined your group`]
      );
    }
    
    res.json({ success: true, message: 'Successfully joined the group' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Leave group
router.post('/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Check if user is a member
    const [membership] = await db.query(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = "joined"',
      [groupId, userId]
    );
    
    if (membership.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are not a member of this group' 
      });
    }
    
    // If user is the last admin, check if there are other members
    if (membership[0].role === 'admin') {
      const [otherAdmins] = await db.query(
        'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND role = "admin" AND status = "joined" AND user_id != ?',
        [groupId, userId]
      );
      
      if (otherAdmins[0].count === 0) {
        const [otherMembers] = await db.query(
          'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND status = "joined" AND user_id != ?',
          [groupId, userId]
        );
        
        if (otherMembers[0].count > 0) {
          // Promote another member to admin
          const [oldestMember] = await db.query(
            'SELECT user_id FROM group_members WHERE group_id = ? AND status = "joined" AND user_id != ? ORDER BY created_at LIMIT 1',
            [groupId, userId]
          );
          
          if (oldestMember.length > 0) {
            await db.query(
              'UPDATE group_members SET role = "admin" WHERE group_id = ? AND user_id = ?',
              [groupId, oldestMember[0].user_id]
            );
          }
        }
      }
    }
    
    await db.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    
    res.json({ success: true, message: 'Successfully left the group' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove member from group - ADMIN ONLY
router.delete('/:groupId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user.id;
    
    // Check if admin is actually an admin
    const adminRole = await getUserGroupRole(adminId, groupId);
    if (!['admin', 'owner'].includes(adminRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only group admins can remove members' 
      });
    }
    
    // Can't remove self (use leave instead)
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Use the leave endpoint to remove yourself' 
      });
    }
    
    // Can't remove other admins unless you're owner
    const targetRole = await getUserGroupRole(userId, groupId);
    if (targetRole === 'admin' && adminRole !== 'owner') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only group owner can remove other admins' 
      });
    }
    
    await db.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search groups (public only)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    const [groups] = await db.query(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'joined') as member_count,
        (SELECT username FROM users u WHERE u.id = g.creator_id) as creator_name
      FROM groups g
      WHERE (g.name LIKE ? OR g.game_specialty LIKE ?)
      AND g.visibility = 'public'
      ORDER BY g.created_at DESC
      LIMIT 20
    `, [`%${query}%`, `%${query}%`]);
    
    res.json({ success: true, groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search users for inviting
router.get('/search-users', authenticateToken, async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username || username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username must be at least 3 characters' 
      });
    }
    
    const [users] = await db.query(`
      SELECT id, username, profile_pic, rank
      FROM users
      WHERE username LIKE ? AND id != ?
      LIMIT 10
    `, [`%${username}%`, req.user.id]);
    
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update group settings - ADMIN ONLY
router.put('/:groupId/settings', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, game_specialty, max_members, visibility } = req.body;
    const userId = req.user.id;
    
    // Check if user is admin
    const userRole = await getUserGroupRole(userId, groupId);
    if (!['admin', 'owner'].includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only group admins can update settings' 
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (game_specialty !== undefined) {
      updates.push('game_specialty = ?');
      values.push(game_specialty);
    }
    if (max_members !== undefined) {
      // Check current members count
      const capacity = await checkGroupCapacity(groupId);
      if (max_members < capacity.current) {
        return res.status(400).json({
          success: false,
          message: `Cannot set max members to ${max_members}. Group already has ${capacity.current} members.`
        });
      }
      updates.push('max_members = ?');
      values.push(max_members);
    }
    if (visibility !== undefined) {
      updates.push('visibility = ?');
      values.push(visibility);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(groupId);
    
    const query = `UPDATE groups SET ${updates.join(', ')} WHERE id = ?`;
    await db.query(query, values);
    
    res.json({ 
      success: true, 
      message: 'Group settings updated successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;