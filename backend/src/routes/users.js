const express = require('express');
const Joi = require('joi');
const { User } = require('../models/User.js');
const { authenticateToken } = require('../middleware/auth.js');
const db = require('../config/database');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstname: Joi.string().max(100).optional().allow('', null),
  lastname: Joi.string().max(100).optional().allow('', null),
  profile_pic: Joi.string().uri().optional().allow('', null)
});

const setPinSchema = Joi.object({
  pin: Joi.string().length(4).pattern(/^\d+$/).required()
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// SEARCH USERS - MOVED HERE (BEFORE :id routes)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log('🔍 Search endpoint called with query:', query);
    
    if (!query || query.length < 2) {
      return res.json({ 
        success: true,
        users: [] 
      });
    }

    const [users] = await db.execute(
      `SELECT id, username, profile_pic, rank, matches_played, wins, losses, win_rate
       FROM users 
       WHERE username LIKE ? AND id != ? AND is_banned = 0
       LIMIT 10`,
      [`%${query}%`, req.user.id]
    );

    console.log('✅ Found users:', users.length);
    
    res.json({ 
      success: true,
      users: users || []
    });
  } catch (error) {
    console.error('❌ User search error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Search failed',
      users: []
    });
  }
});

// Get user by ID (for viewing other users' profiles)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.email, u.firstname, u.lastname, u.profile_pic, 
              u.rank, u.matches_played, u.wins, u.losses, u.balance, u.win_rate,
              u.xp_points, u.wallet_account_number, u.bio, u.account_status,
              u.created_at, u.is_banned, u.is_admin,
              ur.name as rank_name, ur.color as rank_color, ur.glow as rank_glow
       FROM users u
       LEFT JOIN rank_requirements ur ON u.rank = ur.rank
       WHERE u.id = ? AND u.is_banned = 0`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's equipped title
    const [titles] = await db.execute(
      `SELECT t.name, t.tier, t.color, t.icon, t.description
       FROM user_titles ut
       JOIN titles t ON ut.title_id = t.id
       WHERE ut.user_id = ? AND ut.is_equipped = 1
       LIMIT 1`,
      [userId]
    );

    // Get user stats from user_stats table
    const [stats] = await db.execute(
      `SELECT * FROM user_stats WHERE user_id = ?`,
      [userId]
    );

    const user = {
      ...users[0],
      equipped_title: titles.length > 0 ? titles[0] : null,
      stats: stats.length > 0 ? stats[0] : null
    };

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get user's rank progress - FIXED TO USE NEXT RANK REQUIREMENTS
router.get('/:id/rank-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user's current rank and stats
    const [userData] = await db.execute(
      `SELECT id, rank, username, wins, matches_played, win_rate, balance 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (userData.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userData[0];
    
    // Get current rank requirements
    const [currentRankData] = await db.execute(
      `SELECT * FROM rank_requirements WHERE rank = ?`,
      [user.rank]
    );

    if (currentRankData.length === 0) {
      return res.status(404).json({ error: 'Rank not found' });
    }

    const currentRank = currentRankData[0];
    
    // GET NEXT RANK IN SEQUENCE (Fixed!)
    // Instead of using target_rank, get the next rank based on hierarchy
    let nextRank = null;
    
    // Define rank sequence based on your table
    const rankSequence = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E'];
    
    // Find current rank position
    const currentRankIndex = rankSequence.indexOf(user.rank);
    
    // Get next rank if not at highest rank
    if (currentRankIndex > 0) {
      const nextRankCode = rankSequence[currentRankIndex - 1];
      const [nextRankData] = await db.execute(
        `SELECT * FROM rank_requirements WHERE rank = ?`,
        [nextRankCode]
      );
      if (nextRankData.length > 0) {
        nextRank = nextRankData[0];
      }
    }

    // Get target rank for higher rank defeats (from next rank's target_rank)
    let targetRank = nextRank ? nextRank.target_rank : null;

    // Get user's additional stats for ranking
    // 1. Staked wins (wins with stake amount >= requirement)
    let stakedWins = 0;
    if (nextRank && nextRank.min_staked_wins > 0 && nextRank.min_stake_amount > 0) {
      const [stakedWinsData] = await db.execute(
        `SELECT COUNT(*) as count FROM matches 
         WHERE winner_id = ? 
           AND stake_amount >= ?
           AND status = 'completed'`,
        [userId, nextRank.min_stake_amount]
      );
      stakedWins = stakedWinsData[0].count || 0;
    }

    // 2. Tournament wins
    let tournamentWins = 0;
    if (nextRank && nextRank.min_tournament_wins > 0) {
      const [tournamentWinsData] = await db.execute(
        `SELECT COUNT(DISTINCT tp.tournament_id) as count
         FROM tournament_participants tp
         JOIN tournaments t ON tp.tournament_id = t.id
         WHERE tp.user_id = ? 
           AND t.status = 'completed'
           AND t.winner_id = ?`,
        [userId, userId]
      );
      tournamentWins = tournamentWinsData[0].count || 0;
    }

    // 3. Higher rank defeats (if required) - uses targetRank from nextRank
    let higherRankDefeats = 0;
    if (nextRank && nextRank.min_higher_rank_defeats > 0 && targetRank) {
      const [higherRankDefeatsData] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM matches m
         JOIN users opponent ON (m.player1_id = opponent.id OR m.player2_id = opponent.id)
         WHERE m.winner_id = ?
           AND opponent.id != ?
           AND opponent.rank = ?
           AND m.status = 'completed'`,
        [userId, userId, targetRank]
      );
      higherRankDefeats = higherRankDefeatsData[0].count || 0;
    }

    // 4. Tournament type wins (Free for All, Squad, 1vs1)
    let freeforallWins = 0;
    let squadWins = 0;
    let onevsoneWins = 0;
    
    if (nextRank && (nextRank.min_freeforall_wins > 0 || nextRank.min_squad_wins > 0 || nextRank.min_onevsone_wins > 0)) {
      const [tournamentTypeWins] = await db.execute(
        `SELECT 
           SUM(CASE WHEN t.type = 'freeforall' THEN 1 ELSE 0 END) as freeforall_wins,
           SUM(CASE WHEN t.type = 'squad' THEN 1 ELSE 0 END) as squad_wins,
           SUM(CASE WHEN t.type = 'onevsone' THEN 1 ELSE 0 END) as onevsone_wins
         FROM tournaments t
         WHERE t.winner_id = ? AND t.status = 'completed'`,
        [userId]
      );
      
      freeforallWins = tournamentTypeWins[0].freeforall_wins || 0;
      squadWins = tournamentTypeWins[0].squad_wins || 0;
      onevsoneWins = tournamentTypeWins[0].onevsone_wins || 0;
    }

    // Calculate progress percentages for EACH requirement
    // IMPORTANT: Use NEXT rank's requirements for progress calculation
    const progress = {
      // Main Requirements (from users table)
      wins: {
        label: 'Wins',
        icon: 'trophy',
        current: user.wins,
        required: nextRank ? nextRank.min_wins : currentRank.min_wins,
        percentage: nextRank ? 
          Math.min(100, (user.wins / Math.max(1, nextRank.min_wins)) * 100) :
          100, // At highest rank, show 100%
        color: '#FBBF24' // yellow
      },
      
      matches: {
        label: 'Matches Played',
        icon: 'gamepad',
        current: user.matches_played,
        required: nextRank ? nextRank.min_matches : currentRank.min_matches,
        percentage: nextRank ? 
          Math.min(100, (user.matches_played / Math.max(1, nextRank.min_matches)) * 100) :
          100, // At highest rank, show 100%
        color: '#60A5FA' // blue
      },
      
      win_rate: {
        label: 'Win Rate',
        icon: 'trending-up',
        current: parseFloat(user.win_rate),
        required: nextRank ? parseFloat(nextRank.win_rate) : parseFloat(currentRank.win_rate),
        percentage: nextRank ? 
          Math.min(100, (parseFloat(user.win_rate) / Math.max(1, parseFloat(nextRank.win_rate))) * 100) :
          100, // At highest rank, show 100%
        color: '#10B981' // green
      }
    };

    // Add additional requirements only if they exist for NEXT rank
    if (nextRank && nextRank.min_staked_wins > 0) {
      progress.staked_wins = {
        label: `Staked Wins (≥₦${nextRank.min_stake_amount || 0})`,
        icon: 'coins',
        current: stakedWins,
        required: nextRank.min_staked_wins,
        percentage: Math.min(100, (stakedWins / Math.max(1, nextRank.min_staked_wins)) * 100),
        color: '#F59E0B' // orange
      };
    }

    if (nextRank && nextRank.min_tournament_wins > 0) {
      progress.tournament_wins = {
        label: 'Tournament Wins',
        icon: 'trophy',
        current: tournamentWins,
        required: nextRank.min_tournament_wins,
        percentage: Math.min(100, (tournamentWins / Math.max(1, nextRank.min_tournament_wins)) * 100),
        color: '#8B5CF6' // purple
      };
    }

    if (nextRank && nextRank.min_higher_rank_defeats > 0) {
      progress.higher_rank_defeats = {
        label: `Defeat ${targetRank || 'Higher'} Ranks`,
        icon: 'swords',
        current: higherRankDefeats,
        required: nextRank.min_higher_rank_defeats,
        percentage: Math.min(100, (higherRankDefeats / Math.max(1, nextRank.min_higher_rank_defeats)) * 100),
        color: '#EF4444' // red
      };
    }

    if (nextRank && nextRank.min_freeforall_wins > 0) {
      progress.freeforall_wins = {
        label: 'Free for All Wins',
        icon: 'users',
        current: freeforallWins,
        required: nextRank.min_freeforall_wins,
        percentage: Math.min(100, (freeforallWins / Math.max(1, nextRank.min_freeforall_wins)) * 100),
        color: '#EC4899' // pink
      };
    }

    if (nextRank && nextRank.min_squad_wins > 0) {
      progress.squad_wins = {
        label: 'Squad Wins',
        icon: 'users',
        current: squadWins,
        required: nextRank.min_squad_wins,
        percentage: Math.min(100, (squadWins / Math.max(1, nextRank.min_squad_wins)) * 100),
        color: '#14B8A6' // teal
      };
    }

    if (nextRank && nextRank.min_onevsone_wins > 0) {
      progress.onevsone_wins = {
        label: '1vs1 Wins',
        icon: 'user',
        current: onevsoneWins,
        required: nextRank.min_onevsone_wins,
        percentage: Math.min(100, (onevsoneWins / Math.max(1, nextRank.min_onevsone_wins)) * 100),
        color: '#3B82F6' // blue
      };
    }

    // Calculate overall completion percentage
    // Only count requirements that have a required value > 0
    const requirements = Object.values(progress);
    const validRequirements = requirements.filter(req => req.required > 0);
    const totalWeight = validRequirements.length;
    
    let completedRequirements = 0;
    validRequirements.forEach(req => {
      if (req.current >= req.required) {
        completedRequirements++;
      }
    });

    const overallPercentage = totalWeight > 0 ? 
      Math.round((completedRequirements / totalWeight) * 100) : 
      (nextRank ? 0 : 100); // If at highest rank, 100%

    // Check if user meets all requirements for next rank
    let canRankUp = false;
    if (nextRank) {
      canRankUp = validRequirements.every(req => req.current >= req.required);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          rank: user.rank,
          current_wins: user.wins,
          current_matches: user.matches_played,
          current_win_rate: user.win_rate,
          balance: user.balance
        },
        current_rank: {
          ...currentRank,
          color: currentRank.color || '#FFFFFF',
          glow: currentRank.glow || '0 0 10px #FFFFFF'
        },
        next_rank: nextRank,
        progress: progress,
        stats: {
          wins: user.wins,
          matches: user.matches_played,
          win_rate: user.win_rate,
          staked_wins: stakedWins,
          tournament_wins: tournamentWins,
          higher_rank_defeats: higherRankDefeats,
          freeforall_wins: freeforallWins,
          squad_wins: squadWins,
          onevsone_wins: onevsoneWins
        },
        overall_percentage: overallPercentage,
        can_rank_up: canRankUp,
        requirements_met: completedRequirements,
        total_requirements: totalWeight
      }
    });
  } catch (error) {
    console.error('Get rank progress error:', error);
    res.status(500).json({ error: 'Failed to fetch rank progress' });
  }
});

// Get user's earned titles
router.get('/:id/titles', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [titles] = await db.execute(
      `SELECT ut.id, ut.title_id, ut.earned_at, ut.is_equipped, ut.tournament_id,
              t.name, t.tier, t.description, t.color, t.icon
       FROM user_titles ut
       JOIN titles t ON ut.title_id = t.id
       WHERE ut.user_id = ?
       ORDER BY 
         CASE t.tier 
           WHEN 'sacred' THEN 1
           WHEN 'disputable' THEN 2
           WHEN 'class' THEN 3
           ELSE 4
         END,
         ut.earned_at DESC`,
      [userId]
    );

    // Group titles by tier
    const titlesByTier = {
      sacred: [],
      disputable: [],
      class: []
    };

    titles.forEach(title => {
      if (titlesByTier[title.tier]) {
        titlesByTier[title.tier].push(title);
      }
    });

    res.json({
      success: true,
      data: {
        all: titles,
        by_tier: titlesByTier,
        total: titles.length
      }
    });
  } catch (error) {
    console.error('Get user titles error:', error);
    res.status(500).json({ error: 'Failed to fetch user titles' });
  }
});

// Equip a title
router.post('/:id/titles/equip', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const { title_id } = req.body;

    // Verify the title belongs to the user
    const [userTitle] = await db.execute(
      `SELECT id FROM user_titles WHERE user_id = ? AND title_id = ?`,
      [userId, title_id]
    );

    if (userTitle.length === 0) {
      return res.status(404).json({ error: 'Title not found for this user' });
    }

    // First, unequip all titles
    await db.execute(
      `UPDATE user_titles SET is_equipped = 0 WHERE user_id = ?`,
      [userId]
    );

    // Then equip the selected title
    await db.execute(
      `UPDATE user_titles SET is_equipped = 1 WHERE user_id = ? AND title_id = ?`,
      [userId, title_id]
    );

    // Get the equipped title details
    const [equippedTitle] = await db.execute(
      `SELECT t.name, t.tier, t.color, t.icon, t.description
       FROM user_titles ut
       JOIN titles t ON ut.title_id = t.id
       WHERE ut.user_id = ? AND ut.is_equipped = 1
       LIMIT 1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Title equipped successfully',
      data: equippedTitle[0] || null
    });
  } catch (error) {
    console.error('Equip title error:', error);
    res.status(500).json({ error: 'Failed to equip title' });
  }
});

// Unequip title
router.post('/:id/titles/unequip', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    await db.execute(
      `UPDATE user_titles SET is_equipped = 0 WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Title unequipped successfully'
    });
  } catch (error) {
    console.error('Unequip title error:', error);
    res.status(500).json({ error: 'Failed to unequip title' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.updateProfile(req.user.id, value);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Set transaction PIN
router.post('/set-pin', authenticateToken, async (req, res) => {
  try {
    const { error, value } = setPinSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    await User.setTransactionPin(req.user.id, value.pin);

    res.json({
      success: true,
      message: 'Transaction PIN set successfully'
    });
  } catch (error) {
    console.error('Set PIN error:', error);
    res.status(500).json({ error: 'Failed to set transaction PIN' });
  }
});

// Get user stats for profile
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [userStats] = await db.execute(
      `SELECT username, rank, matches_played, wins, losses, win_rate, profile_pic, created_at
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (userStats.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: userStats[0]
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Get user's match history
router.get('/:id/match-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [matches] = await db.execute(
      `SELECT m.id, m.game, m.stake_amount, m.prize_pool_amount, m.status, m.winner_id,
              m.created_at, m.completed_at,
              p1.username as player1_username,
              p2.username as player2_username,
              winner.username as winner_username
       FROM matches m
       LEFT JOIN users p1 ON m.player1_id = p1.id
       LEFT JOIN users p2 ON m.player2_id = p2.id
       LEFT JOIN users winner ON m.winner_id = winner.id
       WHERE (m.player1_id = ? OR m.player2_id = ?)
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, parseInt(limit), offset]
    );

    const [totalCount] = await db.execute(
      `SELECT COUNT(*) as total
       FROM matches
       WHERE player1_id = ? OR player2_id = ?`,
      [userId, userId]
    );

    res.json({
      success: true,
      data: {
        matches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].total
        }
      }
    });
  } catch (error) {
    console.error('Get match history error:', error);
    res.status(500).json({ error: 'Failed to fetch match history' });
  }
});

// Get user's tournament history
router.get('/:id/tournament-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [tournaments] = await db.execute(
      `SELECT t.id, t.name, t.game, t.entry_fee, t.prize_pool, t.status,
              t.start_date, t.completed_at, t.winner_id,
              winner.username as winner_username,
              creator.username as creator_username
       FROM tournaments t
       LEFT JOIN users winner ON t.winner_id = winner.id
       LEFT JOIN users creator ON t.creator_id = creator.id
       WHERE EXISTS (
         SELECT 1 FROM tournament_participants tp 
         WHERE tp.tournament_id = t.id AND tp.user_id = ?
       )
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    const [totalCount] = await db.execute(
      `SELECT COUNT(*) as total
       FROM tournament_participants tp
       WHERE tp.user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        tournaments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].total
        }
      }
    });
  } catch (error) {
    console.error('Get tournament history error:', error);
    res.status(500).json({ error: 'Failed to fetch tournament history' });
  }
});

router.post('/update-last-seen', authenticateToken, async (req, res) => {
  try {
    await db.execute(
      'UPDATE users SET last_seen = NOW() WHERE id = ?',
      [req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Last seen updated'
    });
  } catch (error) {
    console.error('Error updating last seen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update last seen'
    });
  }
});

module.exports = router;