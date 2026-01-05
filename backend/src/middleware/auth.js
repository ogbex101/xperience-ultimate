const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    console.log('Decoded token:', decoded); // Debug log
    
    // Get user from database to ensure they still exist and are not banned
    const [users] = await db.execute(
      'SELECT id, username, email, is_admin, is_banned FROM users WHERE id = ?',
      [decoded.userId || decoded.id] // Try both possible fields
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (users[0].is_banned) {
      return res.status(403).json({ error: 'Account has been suspended' });
    }

    req.user = {
      id: users[0].id,
      userId: users[0].id, // Set both id and userId for compatibility
      username: users[0].username,
      email: users[0].email,
      is_admin: users[0].is_admin
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'fallback_secret', 
    { expiresIn: '24h' }
  );
  
  const refreshToken = jwt.sign(
    { userId }, 
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', 
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

module.exports = { 
  authenticateToken, 
  requireAdmin, 
  generateTokens 
};