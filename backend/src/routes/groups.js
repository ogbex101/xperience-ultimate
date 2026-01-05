const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Add visibility column to groups table (run this SQL in your database first):
// ALTER TABLE groups ADD COLUMN visibility ENUM('public', 'private') DEFAULT 'public';

// Create a new group (updated with visibility)
router.post('/create', async (req, res) => {
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

// Get user's groups (FIXED with member count)
router.get('/my-groups', async (req, res) => {
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

// Get group members (NEW ROUTE - fixes member count)
router.get('/:groupId/members', async (req, res) => {
    try {
        const { groupId } = req.params;
        
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

// Get popular groups (based on tournament participations and wins)
router.get('/popular', async (req, res) => {
    try {
        const [groups] = await db.query(`
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
                      OR t.group_id = g.id)) as tournament_wins,
                CASE 
                    WHEN EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = ?) THEN true
                    ELSE false
                END as is_member
            FROM groups g
            JOIN users u ON g.creator_id = u.id
            WHERE g.visibility = 'public'
            ORDER BY 
                (tournament_wins * 3 + tournament_participations * 2 + member_count) DESC,
                g.created_at DESC
            LIMIT 10
        `, [req.user.id]);
        
        res.json({ success: true, groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Discover groups (public groups user is not in)
router.get('/discover', async (req, res) => {
    try {
        const [groups] = await db.query(`
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
        `, [req.user.id]);
        
        res.json({ success: true, groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Request to join group
router.post('/:groupId/request', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // Check if group exists and is public
        const [group] = await db.query(
            'SELECT visibility FROM groups WHERE id = ?',
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
            [groupId, req.user.id]
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
        const [currentMembers] = await db.query(
            'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND status = "joined"',
            [groupId]
        );
        
        const [groupCapacity] = await db.query(
            'SELECT max_members FROM groups WHERE id = ?',
            [groupId]
        );
        
        if (currentMembers[0].count >= groupCapacity[0].max_members) {
            return res.status(400).json({ 
                success: false, 
                message: 'Group has reached maximum capacity' 
            });
        }
        
        // Create join request
        await db.query(
            'INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, "member", "requested")',
            [groupId, req.user.id]
        );
        
        // Notify group admins
        const [admins] = await db.query(
            'SELECT user_id FROM group_members WHERE group_id = ? AND role = "admin" AND status = "joined"',
            [groupId]
        );
        
        for (const admin of admins) {
            await db.query(
                'INSERT INTO notifications (user_id, sender_id, message, type, status) VALUES (?, ?, ?, "group_join_request", "unread")',
                [admin.user_id, req.user.id, `${req.user.username} has requested to join your group "${group[0].name}"`]
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

// Get group details (updated with visibility)
router.get('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        const [group] = await db.query(
            'SELECT * FROM groups WHERE id = ?',
            [groupId]
        );
        
        if (group.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
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
            members 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// Invite user to group
router.post('/:groupId/invite', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;
        
        // Check if user has permission
        const [userRole] = await db.query(
            'SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = "joined"',
            [groupId, req.user.id]
        );
        
        if (userRole.length === 0 || userRole[0].role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only group admins can invite users' 
            });
        }
        
        // Check if user is already a member
        const [existing] = await db.query(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'User is already a member or has a pending invitation' 
            });
        }
        
        // Check group capacity
        const [group] = await db.query(
            'SELECT max_members FROM groups WHERE id = ?',
            [groupId]
        );
        
        const [currentMembers] = await db.query(
            'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND status = "joined"',
            [groupId]
        );
        
        if (currentMembers[0].count >= group[0].max_members) {
            return res.status(400).json({ 
                success: false, 
                message: 'Group has reached maximum capacity' 
            });
        }
        
        // Create invitation
        await db.query(
            'INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, "member", "invited")',
            [groupId, userId]
        );
        
        // Create notification
        await db.query(
            'INSERT INTO notifications (user_id, sender_id, message, type, status) VALUES (?, ?, ?, "invite", "unread")',
            [userId, req.user.id, `${req.user.username} has invited you to join their group`]
        );
        
        res.json({ success: true, message: 'Invitation sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Join group (accept invitation)
router.post('/:groupId/join', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // Check if invited
        const [invitation] = await db.query(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND status = "invited"',
            [groupId, req.user.id]
        );
        
        if (invitation.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No invitation found for this group' 
            });
        }
        
        // Check group capacity
        const [group] = await db.query(
            'SELECT max_members FROM groups WHERE id = ?',
            [groupId]
        );
        
        const [currentMembers] = await db.query(
            'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND status = "joined"',
            [groupId]
        );
        
        if (currentMembers[0].count >= group[0].max_members) {
            return res.status(400).json({ 
                success: false, 
                message: 'Group has reached maximum capacity' 
            });
        }
        
        // Update membership status
        await db.query(
            'UPDATE group_members SET status = "joined" WHERE group_id = ? AND user_id = ?',
            [groupId, req.user.id]
        );
        
        // Notify group admins
        const [admins] = await db.query(
            'SELECT user_id FROM group_members WHERE group_id = ? AND role = "admin" AND status = "joined"',
            [groupId]
        );
        
        for (const admin of admins) {
            await db.query(
                'INSERT INTO notifications (user_id, sender_id, message, type, status) VALUES (?, ?, ?, "system", "unread")',
                [admin.user_id, req.user.id, `${req.user.username} has joined your group`]
            );
        }
        
        res.json({ success: true, message: 'Successfully joined the group' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Leave group
router.post('/:groupId/leave', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        await db.query(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, req.user.id]
        );
        
        res.json({ success: true, message: 'Successfully left the group' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Remove member from group (admin only)
router.delete('/:groupId/members/:userId', async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        
        // Check if user is admin
        const [userRole] = await db.query(
            'SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = "joined"',
            [groupId, req.user.id]
        );
        
        if (userRole.length === 0 || userRole[0].role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only group admins can remove members' 
            });
        }
        
        // Can't remove self (use leave instead)
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Use the leave endpoint to remove yourself' 
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

// Search groups
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        
        const [groups] = await db.query(`
            SELECT g.*, 
                   (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'joined') as member_count,
                   (SELECT username FROM users u WHERE u.id = g.creator_id) as creator_name
            FROM groups g
            WHERE g.name LIKE ? OR g.game_specialty LIKE ?
            ORDER BY g.created_at DESC
            LIMIT 20
        `, [`%${query}%`, `%${query}%`]);
        
        res.json({ success: true, groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// Add this to backend/src/routes/groups.js
router.get('/search-users', async (req, res) => {
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

// Update the invite endpoint to accept username instead of userId
router.post('/:groupId/invite', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { username } = req.body;
    
    // First, find user by username
    const [users] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const userId = users[0].id;
    
    // Rest of the existing invite logic...
    // [Keep the existing code from line 76 onward in your groups.js]
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;