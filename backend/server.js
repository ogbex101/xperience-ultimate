// server.js - MINIMAL UPDATED VERSION
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // ← KEEP ONLY THIS ONE
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const db = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const tournamentRoutes = require('./src/routes/tournaments');
const matchRoutes = require('./src/routes/matches');
const friendsRoutes = require('./src/routes/friends');
const groupsRoutes = require('./src/routes/groups');
const chatRoutes = require('./src/routes/chat');
const adminRoutes = require('./src/routes/admin');
const leaderboardRoutes = require('./src/routes/leaderboard');
// Import wallet routes
const walletRoutes = require('./src/routes/wallet');

// Import middleware
const { authenticateToken } = require('./src/middleware/auth');

// Import socket handler
const { initializeSocket } = require('./src/services/socketService');
const notificationsRouter = require('./src/routes/notifications');
const suggestedPlayersRoutes = require('./src/routes/suggestedPlayers');
const matchChatRoutes = require('./src/routes/matchChat');


// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true // Add this
  }
});

// Rate limiting
/*const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});*/

// Middleware
//app.use(helmet());
//app.use(limiter);
// Handle OPTIONS (preflight) requests FIRST
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - Add this
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Static files
app.use('/uploads', express.static('uploads'));

// ============ ROUTES ============

// 1. Public routes (NO authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
// Add this line with other route registrations
app.use('/api/suggested-players', authenticateToken, suggestedPlayersRoutes);
app.use('/api/matches', authenticateToken, matchChatRoutes);

// 2. Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'XP Gaming Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// 3. Public match routes for testing
app.get('/api/matches/open', async (req, res) => {
  try {
    res.json({
      success: true,
      matches: [
        {
          id: 1,
          game: "Call of Duty: Warzone",
          stake_amount: 1000,
          prize_pool_amount: 1700,
          prize_pool_option: "entry_fee",
          creator_username: "test_player",
          creator_rank: "E",
          creator_win_rate: 50.0,
          status: "pending",
          scheduled_at: new Date(),
          player2_id: null
        }
      ]
    });
  } catch (error) {
    console.error('Error in open matches route:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching open challenges'
    });
  }
});
app.use('/api/admin', adminRoutes);
// 4. ALL SOCIAL FEATURES ROUTES REQUIRE AUTHENTICATION
app.use('/api/friends', authenticateToken, friendsRoutes);
app.use('/api/groups', authenticateToken, groupsRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/suggested-players', suggestedPlayersRoutes);
// 5. Other authenticated routes
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/tournaments', authenticateToken, tournamentRoutes);
app.use('/api/matches', authenticateToken, matchRoutes);
// Add wallet routes (requires authentication)
app.use('/api/wallet', authenticateToken, walletRoutes);
app.use('/api/notifications', authenticateToken, notificationsRouter);

// Initialize Socket.io
initializeSocket(io);

// In your server.js, after io initialization
io.on('connection', (socket) => {
  console.log('🔵 Socket.io: User connected:', {
    userId: socket.userId,
    username: socket.username,
    socketId: socket.id
  });
  
  socket.on('disconnect', () => {
    console.log('🔴 Socket.io: User disconnected:', socket.userId);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Socket.io error:', error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🎮 XP Gaming Platform Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});