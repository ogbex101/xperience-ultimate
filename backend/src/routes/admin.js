const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// ==================== TEST & DEBUG ROUTES ====================

// Test endpoint - should always work
router.get('/test', (req, res) => {
  console.log('🔧 Admin API test endpoint called');
  res.json({ 
    success: true, 
    message: 'Admin API is working',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple test login (no database required)
router.post('/login-test', (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 TEST Admin login attempt:', { username, password: '***' });
    
    // Hardcoded credentials for testing
    if (username === 'admin' && password === 'admin@2005') {
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: 1, 
          username: 'admin', 
          role: 'super_admin',
          type: 'admin'
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );
      
      console.log('✅ Test login successful');
      
      return res.json({
        success: true,
        message: 'Login successful (TEST MODE)',
        token,
        admin: {
          id: 1,
          username: 'admin',
          email: 'admin@xperience.com',
          role: 'super_admin'
        }
      });
    }
    
    console.log('❌ Test login failed: Invalid credentials');
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials. Use admin/admin@2005 for testing' 
    });
    
  } catch (error) {
    console.error('❌ Login test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during test login' 
    });
  }
});

// ==================== MIDDLEWARE ====================

// Middleware to verify admin token
const authenticateAdmin = async (req, res, next) => {
  try {
    console.log('🛡️ Admin auth middleware checking...');
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({ 
        success: false, 
        message: 'Admin token required' 
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('Token decoded:', decoded);
    
    // Check if user is admin
    const [admin] = await db.execute(
      'SELECT id, username, role, is_active FROM admin_users WHERE id = ?',
      [decoded.id]
    );

    if (!admin[0] || !admin[0].is_active) {
      console.log('❌ Admin not found or inactive');
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access denied' 
      });
    }

    req.admin = admin[0];
    console.log('✅ Admin authenticated:', admin[0].username);
    next();
  } catch (error) {
    console.error('❌ Admin auth error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid admin token' 
    });
  }
};

// ==================== ADMIN AUTH ====================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Admin login attempt for:', username);
    console.log('Password received (first 3 chars):', password ? password.substring(0, 3) + '***' : 'none');
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password required' 
      });
    }

    // ============ TEMPORARY: HARDCODED FALLBACK ============
    // This ensures login works even if database is empty
    if (username === 'admin' && password === 'admin@2005') {
      console.log('✅ Using hardcoded admin credentials (FALLBACK)');
      
      // First, try to create admin in database if not exists
      try {
        const [existingAdmins] = await db.execute(
          'SELECT id FROM admin_users WHERE username = ?',
          [username]
        );
        
        if (existingAdmins.length === 0) {
          console.log('⚠️ Creating admin user in database...');
          const hashedPassword = await bcrypt.hash(password, 10);
          await db.execute(
            `INSERT INTO admin_users 
             (username, password_hash, email, role, is_active) 
             VALUES (?, ?, ?, ?, TRUE)`,
            [username, hashedPassword, 'admin@xperience.com', 'super_admin']
          );
          console.log('✅ Admin user created in database');
        }
      } catch (dbError) {
        console.warn('⚠️ Could not check/create admin in database:', dbError.message);
        // Continue with hardcoded token even if DB fails
      }
      
      const token = jwt.sign(
        { 
          id: 999, 
          username: 'admin', 
          role: 'super_admin',
          type: 'admin'
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '8h' }
      );

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        admin: {
          id: 999,
          username: 'admin',
          email: 'admin@xperience.com',
          role: 'super_admin'
        }
      });
    }
    // ============ END TEMPORARY FALLBACK ============

    console.log('🔍 Checking database for admin user...');
    const [admins] = await db.execute(
      'SELECT * FROM admin_users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (admins.length === 0) {
      console.log('❌ Admin user not found in database');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const admin = admins[0];
    console.log('✅ Admin found:', admin.username);
    console.log('Password hash type:', admin.password_hash?.substring(0, 10));
    
    // Check password
    let validPassword = false;
    
    // Try bcrypt compare first
    if (admin.password_hash && admin.password_hash.startsWith('$2')) {
      validPassword = await bcrypt.compare(password, admin.password_hash);
      console.log('🔐 Bcrypt password check:', validPassword ? '✅ Match' : '❌ No match');
    } 
    // If not bcrypt hash, check plain text (for development only)
    else if (admin.password_hash === password) {
      validPassword = true;
      console.log('🔐 Plain password match (DEV MODE)');
    }
    
    if (!validPassword) {
      console.log('❌ Password does not match');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log('✅ Password verified successfully');
    
    // Update last login
    await db.execute(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );

    // Create token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role,
        type: 'admin'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    // Log activity
    try {
      await db.execute(
        `INSERT INTO admin_activity_logs 
         (admin_id, action_type, description, ip_address) 
         VALUES (?, 'login', 'Admin logged in', ?)`,
        [admin.id, req.ip || 'unknown']
      );
    } catch (logError) {
      console.warn('⚠️ Could not log admin activity:', logError.message);
    }

    console.log('🎉 Admin login successful for:', admin.username);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions ? JSON.parse(admin.permissions) : []
      }
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== DASHBOARD STATS ====================
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats for admin:', req.admin.username);
    
    const [stats] = await db.execute(`SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT SUM(balance) FROM users) as total_balance,
      (SELECT SUM(xp_points) FROM users) as total_xp,
      (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
      (SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURDATE()) as today_transactions,
      (SELECT SUM(amount) FROM transactions WHERE DATE(created_at) = CURDATE() AND amount > 0) as today_deposits,
      (SELECT COUNT(*) FROM fraud_flags WHERE status = 'active') as active_fraud_flags
    `);

    // Recent activity
    const [recentWithdrawals] = await db.execute(`SELECT 
      wr.*, u.username, u.email 
      FROM withdrawal_requests wr
      JOIN users u ON wr.user_id = u.id
      WHERE wr.status = 'pending'
      ORDER BY wr.created_at DESC
      LIMIT 10`);

    // Recent users
    const [recentUsers] = await db.execute(`SELECT 
      id, username, email, balance, xp_points, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5`);

    res.json({
      success: true,
      stats: stats[0],
      recent_withdrawals: recentWithdrawals,
      recent_users: recentUsers
    });

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard stats' 
    });
  }
});

// ==================== WITHDRAWAL MANAGEMENT ====================
router.get('/withdrawals', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    console.log('📋 Fetching withdrawals - Status:', status, 'Page:', page);

    let query = `
      SELECT wr.*, u.username, u.email, u.wallet_account_number
      FROM withdrawal_requests wr
      JOIN users u ON wr.user_id = u.id
    `;
    
    const params = [];
    if (status && status !== 'all') {
      query += ' WHERE wr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY wr.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [withdrawals] = await db.execute(query, params);

    // Count total
    let countQuery = 'SELECT COUNT(*) as total FROM withdrawal_requests wr';
    if (status && status !== 'all') {
      countQuery += ' WHERE wr.status = ?';
    }
    const [countResult] = await db.execute(
      countQuery, 
      status && status !== 'all' ? [status] : []
    );
    
    // Log activity
    try {
      await db.execute(
        `INSERT INTO admin_activity_logs 
         (admin_id, action_type, description) 
         VALUES (?, 'view', 'Viewed withdrawal requests')`,
        [req.admin.id]
      );
    } catch (logError) {
      console.warn('⚠️ Could not log activity:', logError.message);
    }

    res.json({
      success: true,
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get withdrawals error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch withdrawals' 
    });
  }
});

router.get('/withdrawals/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching withdrawal details for ID:', id);

    const [withdrawals] = await db.execute(`
      SELECT wr.*, u.*, 
             JSON_UNQUOTE(JSON_EXTRACT(wr.account_details, '$.bank_name')) as bank_name,
             JSON_UNQUOTE(JSON_EXTRACT(wr.account_details, '$.account_number')) as account_number,
             JSON_UNQUOTE(JSON_EXTRACT(wr.account_details, '$.account_name')) as account_name
      FROM withdrawal_requests wr
      JOIN users u ON wr.user_id = u.id
      WHERE wr.id = ?
    `, [id]);

    if (withdrawals.length === 0) {
      console.log('❌ Withdrawal not found:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Withdrawal not found' 
      });
    }

    console.log('✅ Withdrawal found:', withdrawals[0].receipt_number);

    // Get transaction details
    const [transactions] = await db.execute(
      'SELECT * FROM transactions WHERE id = ?',
      [withdrawals[0].transaction_id]
    );

    // Get approval history
    const [approvals] = await db.execute(`
      SELECT wa.*, au.username as admin_username
      FROM withdrawal_approvals wa
      LEFT JOIN admin_users au ON wa.admin_id = au.id
      WHERE wa.withdrawal_request_id = ?
      ORDER BY wa.created_at DESC
    `, [id]);

    res.json({
      success: true,
      withdrawal: withdrawals[0],
      transaction: transactions[0] || null,
      approvals: approvals
    });

  } catch (error) {
    console.error('❌ Get withdrawal details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch withdrawal details' 
    });
  }
});

router.post('/withdrawals/:id/action', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, proof_document } = req.body;
    const adminId = req.admin.id;

    console.log('⚡ Processing withdrawal action:', { 
      withdrawalId: id, 
      action, 
      adminId 
    });

    if (!['approve', 'reject', 'processing', 'completed'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action' 
      });
    }

    // Get withdrawal
    const [withdrawals] = await db.execute(
      'SELECT * FROM withdrawal_requests WHERE id = ?',
      [id]
    );

    if (withdrawals.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Withdrawal not found' 
      });
    }

    const withdrawal = withdrawals[0];
    const oldStatus = withdrawal.status;
    let newStatus = withdrawal.status;

    console.log('📝 Withdrawal current status:', oldStatus);

    switch (action) {
      case 'approve':
        newStatus = 'processing';
        console.log('✅ Approving withdrawal, new status: processing');
        break;
      case 'reject':
        newStatus = 'rejected';
        console.log('❌ Rejecting withdrawal, refunding money');
        // Refund money back to user
        await db.execute(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [withdrawal.amount, withdrawal.user_id]
        );
        break;
      case 'processing':
        newStatus = 'processing';
        break;
      case 'completed':
        newStatus = 'completed';
        console.log('🏁 Marking withdrawal as completed');
        break;
    }

    await db.execute('START TRANSACTION');

    try {
      // Update withdrawal status
      await db.execute(
        'UPDATE withdrawal_requests SET status = ?, processed_by = ?, processed_at = NOW() WHERE id = ?',
        [newStatus, adminId, id]
      );

      // Update transaction status
      await db.execute(
        'UPDATE transactions SET status = ? WHERE id = ?',
        [newStatus, withdrawal.transaction_id]
      );

      // Record approval
      await db.execute(
        `INSERT INTO withdrawal_approvals 
         (withdrawal_request_id, admin_id, old_status, new_status, notes, proof_document) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, adminId, oldStatus, newStatus, notes || null, proof_document || null]
      );

      // Log activity
      await db.execute(
        `INSERT INTO admin_activity_logs 
         (admin_id, action_type, description, affected_user_id, affected_transaction_id) 
         VALUES (?, 'withdrawal_action', ?, ?, ?)`,
        [adminId, `${action} withdrawal #${id}`, withdrawal.user_id, withdrawal.transaction_id]
      );

      await db.execute('COMMIT');
      console.log('💾 Transaction committed successfully');

      res.json({
        success: true,
        message: `Withdrawal ${action}d successfully`,
        new_status: newStatus
      });

    } catch (error) {
      await db.execute('ROLLBACK');
      console.error('❌ Transaction rollback:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Withdrawal action error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process withdrawal' 
    });
  }
});

// ==================== USER MANAGEMENT ====================
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    console.log('👥 Fetching users - Search:', search, 'Page:', page);

    let query = 'SELECT id, username, email, wallet_account_number, balance, xp_points, rank, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' WHERE username LIKE ? OR email LIKE ? OR wallet_account_number LIKE ?';
      countQuery += ' WHERE username LIKE ? OR email LIKE ? OR wallet_account_number LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users' 
    });
  }
});

router.get('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching user details for ID:', id);

    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      console.log('❌ User not found:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get user transactions
    const [transactions] = await db.execute(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [id]
    );

    // Get user XP transactions
    const [xpTransactions] = await db.execute(
      'SELECT * FROM xp_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [id]
    );

    // Get withdrawal history
    const [withdrawals] = await db.execute(
      'SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );

    console.log('✅ User details fetched successfully');

    res.json({
      success: true,
      user: users[0],
      transactions,
      xp_transactions: xpTransactions,
      withdrawals
    });

  } catch (error) {
    console.error('❌ Get user details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user details' 
    });
  }
});

// ==================== SYSTEM SETTINGS ====================
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    console.log('⚙️ Fetching system settings');
    
    const [settings] = await db.execute(
      'SELECT * FROM system_settings ORDER BY category, setting_key'
    );

    res.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('❌ Get settings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch settings' 
    });
  }
});

router.post('/settings/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const adminId = req.admin.id;

    console.log('⚙️ Updating setting:', key, 'Value:', value);

    await db.execute(
      `INSERT INTO system_settings (setting_key, setting_value, updated_by) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?, updated_at = NOW()`,
      [key, value, adminId, value, adminId]
    );

    // Log activity
    await db.execute(
      `INSERT INTO admin_activity_logs 
       (admin_id, action_type, description) 
       VALUES (?, 'settings_update', 'Updated setting: ${key}')`,
      [adminId]
    );

    res.json({
      success: true,
      message: 'Setting updated successfully'
    });

  } catch (error) {
    console.error('❌ Update setting error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update setting' 
    });
  }
});

// ==================== FRAUD MANAGEMENT ====================
router.get('/fraud/flags', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    console.log('🚨 Fetching fraud flags - Status:', status);

    let query = `
      SELECT ff.*, u.username, u.email, au.username as assigned_admin_name
      FROM fraud_flags ff
      JOIN users u ON ff.user_id = u.id
      LEFT JOIN admin_users au ON ff.assigned_admin_id = au.id
    `;
    
    const params = [];
    if (status) {
      query += ' WHERE ff.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ff.severity DESC, ff.created_at DESC';

    const [flags] = await db.execute(query, params);

    res.json({
      success: true,
      flags
    });

  } catch (error) {
    console.error('❌ Get fraud flags error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch fraud flags' 
    });
  }
});

module.exports = router;