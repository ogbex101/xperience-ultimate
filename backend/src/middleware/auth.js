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
      userId: users[0].id,
      username: users[0].username,
      email: users[0].email,
      is_admin: users[0].is_admin === 1 || users[0].is_admin === true
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

// ============ RESOURCE AUTHORIZATION MIDDLEWARE ============

/**
 * Check if user has access to a group resource
 * @param {string} requiredRole - 'viewer', 'member', 'admin', 'owner'
 */
const authorizeGroup = (requiredRole = 'viewer') => {
  return async (req, res, next) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.is_admin;
      
      if (!groupId) {
        return res.status(400).json({ error: 'Group ID required' });
      }
      
      // Admins can access everything
      if (isAdmin) {
        return next();
      }
      
      // Check group visibility first
      const [group] = await db.query(
        'SELECT visibility, creator_id FROM groups WHERE id = ?',
        [groupId]
      );
      
      if (group.length === 0) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Public groups: anyone can view
      if (requiredRole === 'viewer' && group[0].visibility === 'public') {
        return next();
      }
      
      // Check user's membership and role
      const [membership] = await db.query(
        'SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status = "joined"',
        [groupId, userId]
      );
      
      if (membership.length === 0) {
        return res.status(403).json({ 
          error: 'Access denied: You are not a member of this group',
          code: 'NOT_MEMBER'
        });
      }
      
      // Role hierarchy: owner > admin > member > viewer
      const roleHierarchy = { 'owner': 4, 'admin': 3, 'member': 2, 'viewer': 1 };
      const userRoleLevel = roleHierarchy[membership[0].role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
      
      if (userRoleLevel >= requiredRoleLevel) {
        return next();
      }
      
      // Special case: creator is owner
      if (group[0].creator_id === userId) {
        return next();
      }
      
      return res.status(403).json({ 
        error: `Access denied: ${requiredRole} role required`,
        code: 'INSUFFICIENT_ROLE'
      });
      
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

/**
 * Quick check if user is group member (for simple routes)
 */
const isGroupMember = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    const [group] = await db.query(
      'SELECT visibility FROM groups WHERE id = ?',
      [groupId]
    );
    
    if (group.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Public groups allow viewing
    if (group[0].visibility === 'public') {
      return next();
    }
    
    // Check membership for private groups
    const [member] = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = "joined"',
      [groupId, userId]
    );
    
    if (member.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  } catch (error) {
    console.error('Group membership check error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * General resource authorization middleware
 * Can be extended for tournaments, matches, etc.
 */
const authorizeResource = (resourceType, requiredPermission) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[`${resourceType}Id`] || req.params.id;
      const userId = req.user.id;
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID required' });
      }
      
      // Default implementation - extend based on resource type
      switch (resourceType) {
        case 'group':
          // Already handled by authorizeGroup
          break;
        case 'tournament':
          // Will be implemented in tournament routes
          break;
        case 'match':
          // Will be implemented in match routes
          break;
        default:
          console.warn(`Authorization not implemented for resource: ${resourceType}`);
      }
      
      next();
    } catch (error) {
      console.error('Resource authorization error:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
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

// Log unauthorized access attempts
const logUnauthorizedAttempt = (req, resourceType, resourceId) => {
  console.warn(`UNAUTHORIZED ACCESS ATTEMPT:`, {
    userId: req.user?.id,
    ip: req.ip,
    resourceType,
    resourceId,
    path: req.path,
    timestamp: new Date().toISOString()
  });
};

module.exports = { 
  authenticateToken, 
  requireAdmin, 
  generateTokens,
  authorizeGroup,
  isGroupMember,
  authorizeResource,
  logUnauthorizedAttempt
};
