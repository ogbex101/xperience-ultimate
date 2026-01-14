// api.js - COMPLETE UPDATED VERSION WITH MATCH CHAT
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with improved defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Important for CORS with credentials
});

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==================== USER API (Regular API for users) ====================

// Request interceptor to add USER auth token
api.interceptors.request.use(
  (config) => {
    // Get USER token from localStorage (check both keys)
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    console.log(`📡 API Request to: ${config.url}`);
    console.log(`   Method: ${config.method.toUpperCase()}`);
    console.log(`   Token: ${token ? '✅ Present' : '❌ Missing'}`);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`   Auth Header: Set`);
    }
    
    // Log request data if present
    if (config.data && Object.keys(config.data).length > 0) {
      console.log(`   Data:`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response from: ${response.config.url}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Data:`, response.data);
    
    // Return only the data part
    return response.data;
  },
  (error) => {
    const url = error.config?.url || 'unknown endpoint';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    
    console.error(`❌ API Error from: ${method} ${url}`);
    console.error(`   Status: ${error.response?.status || 'No response'}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.response) {
      console.error(`   Response Data:`, error.response.data);
      console.error(`   Headers:`, error.response.headers);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout - server might be down or slow');
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network error - check if server is running');
    }
    
    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      console.error('🔑 Authentication error - clearing tokens and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login?session=expired';
        }, 1000);
      }
    }
    
    if (error.response?.status === 403) {
      console.error('🚫 Forbidden - insufficient permissions');
    }
    
    if (error.response?.status === 404) {
      console.error('🔍 Endpoint not found - check API route');
    }
    
    if (error.response?.status === 500) {
      console.error('💥 Server error - check backend logs');
    }
    
    // Return a structured error object
    return Promise.reject({
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      isNetworkError: !error.response
    });
  }
);

// ==================== ADMIN API (Separate instance for admin) ====================

// Create a separate axios instance for admin
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Admin request interceptor
adminApi.interceptors.request.use(
  (config) => {
    // Get ADMIN token from localStorage
    const adminToken = localStorage.getItem('adminToken');
    
    console.log(`📡 ADMIN API Request to: ${config.url}`);
    console.log(`   Method: ${config.method.toUpperCase()}`);
    console.log(`   Admin Token: ${adminToken ? '✅ Present' : '❌ Missing'}`);
    
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      console.log(`   Admin Auth Header: Set`);
    }
    
    // Log request data if present
    if (config.data && Object.keys(config.data).length > 0) {
      console.log(`   Data:`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Admin request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Admin response interceptor
adminApi.interceptors.response.use(
  (response) => {
    console.log(`✅ ADMIN API Response from: ${response.config.url}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Data:`, response.data);
    
    return response.data;
  },
  (error) => {
    const url = error.config?.url || 'unknown endpoint';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    
    console.error(`❌ ADMIN API Error from: ${method} ${url}`);
    console.error(`   Status: {error.response?.status || 'No response'}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.response) {
      console.error(`   Response Data:`, error.response.data);
    }
    
    // Handle admin-specific auth errors
    if (error.response?.status === 401) {
      console.error('🔑 Admin authentication error - clearing admin token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      
      // Redirect to admin login if on admin page
      if (window.location.pathname.includes('/admin') && 
          !window.location.pathname.includes('/admin/login')) {
        setTimeout(() => {
          window.location.href = '/admin/login?session=expired';
        }, 1000);
      }
    }
    
    if (error.response?.status === 403) {
      console.error('🚫 Admin forbidden - insufficient permissions');
    }
    
    return Promise.reject({
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      isNetworkError: !error.response
    });
  }
);

// ==================== API FUNCTIONS ====================

// Auth API - COMPLETE
const authAPI = {
  login: async (credentials) => {
    console.log('🔐 AuthAPI: Attempting login for:', credentials.email);
    return await api.post('/auth/login', credentials);
  },
  
  register: async (userData) => {
    console.log('📝 AuthAPI: Attempting registration');
    return await api.post('/auth/register', userData);
  },
  
   getProfile: async () => {
    console.log('👤 AuthAPI: Fetching user profile');
    return await api.get('/auth/me');  // ← CORRECT ENDPOINT
  },
  
  getMe: async () => {
    console.log('👤 AuthAPI: Fetching current user data');
    return await api.get('/auth/me');
  },
  
  logout: async () => {
    console.log('🚪 AuthAPI: Logging out');
    return await api.post('/auth/logout');
  },
  
  refreshToken: async () => {
    console.log('🔄 AuthAPI: Refreshing token');
    return await api.post('/auth/refresh');
  }
};

// Users API - COMPLETE (UPDATED FOR DASHBOARD)
const usersAPI = {
  getProfile: async (userId) => {
    console.log(`👤 UsersAPI: Fetching profile for user ${userId}`);
    return await api.get(`/users/${userId}`);
  },
  
  updateProfile: async (userData) => {
    console.log('✏️ UsersAPI: Updating profile');
    return await api.put('/users/profile', userData);
  },
  
  search: async (query) => {
    console.log(`🔍 UsersAPI: Searching for "${query}"`);
    return await api.get(`/users/search?query=${encodeURIComponent(query)}`);
  },
  
  updateStats: async (stats) => {
    console.log('📊 UsersAPI: Updating stats');
    return await api.put('/users/stats', stats);
  },
  
  getLeaderboard: async () => {
    console.log('🏆 UsersAPI: Fetching leaderboard');
    return await api.get('/users/leaderboard');
  },
  
  // NEW PROFILE FUNCTIONS
  getRankProgress: async (userId) => {
    console.log(`📈 UsersAPI: Fetching rank progress for user ${userId}`);
    return await api.get(`/users/${userId}/rank-progress`);
  },
  
  getUserTitles: async (userId) => {
    console.log(`🏷️ UsersAPI: Fetching titles for user ${userId}`);
    return await api.get(`/users/${userId}/titles`);
  },
  
  equipTitle: async (userId, titleId) => {
    console.log(`🏷️ UsersAPI: Equipping title ${titleId} for user ${userId}`);
    return await api.post(`/users/${userId}/titles/equip`, { title_id: titleId });
  },
  
  unequipTitle: async (userId) => {
    console.log(`🏷️ UsersAPI: Unequipping title for user ${userId}`);
    return await api.post(`/users/${userId}/titles/unequip`);
  },
  
  getSuggestedPlayers: (params) => {
    return api.get('/suggested-players', { params });
  },
  
  updateLastSeen: () => {
    return api.post('/users/update-last-seen');
  },
  
  getCompatibility: (playerId) => {
    return api.get(`/suggested-players/compatibility/${playerId}`);
  },
  
  // FIXED: Added getUserStats (was causing error)
  getUserStats: async (userId) => {
    console.log(`📊 UsersAPI: Fetching stats for user ${userId}`);
    try {
      return await api.get(`/users/${userId}/stats`);
    } catch (error) {
      console.error('❌ UsersAPI.getUserStats error:', error);
      // Return default stats if endpoint doesn't exist
      return {
        success: true,
        data: {
          wins: 0,
          matches_played: 0,
          win_rate: 0,
          tournaments_won: 0,
          xp_points: 0
        }
      };
    }
  },
  
  getUserMatchHistory: async (userId, page = 1, limit = 10) => {
    console.log(`🎮 UsersAPI: Fetching match history for user ${userId}`);
    return await api.get(`/users/${userId}/match-history?page=${page}&limit=${limit}`);
  },
  
  getUserTournamentHistory: async (userId, page = 1, limit = 10) => {
    console.log(`🏆 UsersAPI: Fetching tournament history for user ${userId}`);
    return await api.get(`/users/${userId}/tournament-history?page=${page}&limit=${limit}`);
  },
  
  // NEW FUNCTIONS FOR DASHBOARD:
  
  // Get user activity (recent matches, tournaments, etc.)
  getRecentActivity: async (userId, limit = 5) => {
    console.log(`📱 UsersAPI: Fetching recent activity for user ${userId}`);
    try {
      return await api.get(`/users/${userId}/activity?limit=${limit}`);
    } catch (error) {
      console.error('❌ UsersAPI.getRecentActivity error:', error);
      // Return empty activity if endpoint doesn't exist
      return {
        success: true,
        activities: []
      };
    }
  },
  
  // Get live/ongoing tournaments user is in
  getUserLiveTournaments: async (userId) => {
    console.log(`🎯 UsersAPI: Fetching live tournaments for user ${userId}`);
    try {
      return await api.get(`/users/${userId}/live-tournaments`);
    } catch (error) {
      console.error('❌ UsersAPI.getUserLiveTournaments error:', error);
      return {
        success: true,
        tournaments: []
      };
    }
  },
  
  getDashboardSummary: async (userId) => {
  console.log(`📊 UsersAPI: Fetching dashboard for user ${userId}`);
  try {
    return await api.get(`/users/${userId}/dashboard`);
  } catch (error) {
    console.error('❌ UsersAPI.getDashboardSummary error:', error);
    // Return default data if API fails
    return {
      success: true,
      data: {
        tournaments_won: 0,
        matches_played: 0,
        win_rate: 0,
        rank: 'E',
        wins: 0,
        xp_points: 0,
        recent_activity: [],
        live_tournaments: [],
        rank_progress: {
          current: 'E',
          next: 'D',
          progress: 0,
          wins_needed: 10,
          matches_needed: 20,
          win_rate_needed: 50
        }
      }
    };
  }
},
  
  // Get user's tournaments (for win count)
  getUserTournaments: async (userId, status = 'completed') => {
    console.log(`🏆 UsersAPI: Fetching ${status} tournaments for user ${userId}`);
    try {
      return await api.get(`/users/${userId}/tournaments?status=${status}`);
    } catch (error) {
      console.error('❌ UsersAPI.getUserTournaments error:', error);
      return {
        success: true,
        tournaments: []
      };
    }
  },
  getMe: async () => {
  console.log('👤 UsersAPI: Fetching current user data');
  try {
    return await api.get('/auth/me');
  } catch (error) {
    console.error('❌ UsersAPI.getMe error:', error);
    throw error;
  }
},

getProfile: async () => {
  console.log('👤 UsersAPI: Fetching user profile');
  try {
    return await api.get('/auth/profile');
  } catch (error) {
    console.error('❌ UsersAPI.getProfile error:', error);
    throw error;
  }
},

getProfileWithXp: async () => {
  console.log('💰 UsersAPI: Fetching profile with XP');
  try {
    return await api.get('/users/profile-with-xp');
  } catch (error) {
    console.error('❌ UsersAPI.getProfileWithXp error:', error);
    return { 
      success: false, 
      xp_points: 0 
    };
  }
},
  
  // Quick stats for dashboard cards
  getQuickStats: async (userId) => {
    console.log(`⚡ UsersAPI: Fetching quick stats for user ${userId}`);
    try {
      return await api.get(`/users/${userId}/quick-stats`);
    } catch (error) {
      console.error('❌ UsersAPI.getQuickStats error:', error);
      // Return default quick stats
      return {
        success: true,
        data: [
          {
            label: 'Tournaments Won',
            value: '0',
            icon: 'trophy',
            color: 'yellow',
            trend: 'up'
          },
          {
            label: 'Matches Played',
            value: '0',
            icon: 'gamepad',
            color: 'blue',
            trend: 'stable'
          },
          {
            label: 'Win Rate',
            value: '0%',
            icon: 'trending',
            color: 'red',
            trend: 'down'
          },
          {
            label: 'Current Rank',
            value: 'E',
            icon: 'crown',
            color: 'purple',
            trend: 'stable'
          }
        ]
      };
    }
  }
};

// Tournaments API - COMPLETE AND CONSISTENT (UPDATED)
const tournamentsAPI = {
  getAll: async () => {
    console.log('🏆 TournamentsAPI: Fetching all tournaments');
    return await api.get('/tournaments');
  },
  
  getById: async (id) => {
    console.log(`🏆 TournamentsAPI: Fetching tournament ${id}`);
    return await api.get(`/tournaments/${id}`);
  },
  
  create: async (tournamentData) => {
    console.log('🏆 TournamentsAPI: Creating new tournament');
    return await api.post('/tournaments', tournamentData);
  },
  
  join: async (tournamentId, groupData = null) => {
    console.log(`🏆 TournamentsAPI: Joining tournament ${tournamentId}`, groupData);
    return await api.post(`/tournaments/${tournamentId}/join`, groupData || {});
  },
  
  start: async (tournamentId) => {
    console.log(`🏆 TournamentsAPI: Starting tournament ${tournamentId}`);
    return await api.post(`/tournaments/${tournamentId}/start`);
  },
  
  getBracket: async (tournamentId) => {
    console.log(`🏆 TournamentsAPI: Fetching bracket for tournament ${tournamentId}`);
    return await api.get(`/tournaments/${tournamentId}/bracket`);
  },
  
  // NEW CHAT FUNCTIONS
  getChat: async (tournamentId) => {
    console.log(`💬 TournamentsAPI: Fetching chat for tournament ${tournamentId}`);
    return await api.get(`/tournaments/${tournamentId}/chat`);
  },
  
  sendChatMessage: async (tournamentId, message) => {
    console.log(`💬 TournamentsAPI: Sending chat message to tournament ${tournamentId}`);
    return await api.post(`/tournaments/${tournamentId}/chat/send`, { message });
  },
  
  // NEW MANAGEMENT FUNCTIONS
  getManagementData: async (tournamentId) => {
    console.log(`⚙️ TournamentsAPI: Fetching management data for tournament ${tournamentId}`);
    return await api.get(`/tournaments/${tournamentId}/manage`);
  },
  
  generateInviteLink: async (tournamentId) => {
    console.log(`🔗 TournamentsAPI: Generating invite link for tournament ${tournamentId}`);
    return await api.post(`/tournaments/${tournamentId}/generate-invite`);
  },
  
  kickGroup: async (tournamentId, groupData) => {
    console.log(`👢 TournamentsAPI: Kicking group from tournament ${tournamentId}`);
    return await api.post(`/tournaments/${tournamentId}/kick-group`, groupData);
  },
  
  completeWithWinner: async (tournamentId, winnerData) => {
    console.log(`🏆 TournamentsAPI: Completing tournament ${tournamentId} with winner`);
    return await api.post(`/tournaments/${tournamentId}/complete-with-winner`, winnerData);
  },
  
  // SQUAD FUNCTIONS
  getUserGroups: async () => {
    console.log('👥 TournamentsAPI: Fetching user groups');
    return await api.get('/tournaments/user-groups');
  },
  
  getSquads: async (tournamentId) => {
    console.log(`👥 TournamentsAPI: Fetching squads for tournament ${tournamentId}`);
    return await api.get(`/tournaments/${tournamentId}/squads`);
  },
  
  validateGroup: async (tournamentId, groupData) => {
    console.log(`👥 TournamentsAPI: Validating group for tournament ${tournamentId}`, groupData);
    return await api.post(`/tournaments/${tournamentId}/validate-group`, groupData);
  },
  
  // XP FUNCTIONS
  getUserProfile: async () => {
    try {
      console.log('👤 TournamentsAPI: Fetching user profile with XP');
      const response = await api.get('/users/profile-with-xp');
      return response;
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        data: { user: { xp_points: 0 } },
        xp_points: 0
      };
    }
  },
  getBracket: async (tournamentId) => {
    return await api.get(`/tournaments/${tournamentId}/bracket`);
  },
  
  manualAdvance: async (tournamentId, matchId, winnerId) => {
    return await api.post(`/tournaments/${tournamentId}/manual-advance`, {
      match_id: matchId,
      winner_id: winnerId
    });
  },
  
  fixMatches: async (tournamentId) => {
    return await api.post(`/tournaments/${tournamentId}/fix-matches`);
  },
  
  start: async (tournamentId) => {
    return await api.post(`/tournaments/${tournamentId}/start`);
  },
  
  getUserXP: async () => {
    try {
      console.log('💰 TournamentsAPI: Fetching user XP');
      const response = await api.get('/users/xp');
      return response;
    } catch (error) {
      console.error('Get user XP error:', error);
      return { 
        success: false, 
        xp_points: 0 
      };
    }
  },
  
  getUserTournaments: async () => {
    console.log('📋 TournamentsAPI: Fetching user tournaments');
    return await api.get('/tournaments/my-tournaments');
  },
  
  // OTHER FUNCTIONS (keep as is)
  getMatchDetails: async (tournamentId, matchId) => {
    console.log(`🎮 TournamentsAPI: Fetching match ${matchId} in tournament ${tournamentId}`);
    return await api.get(`/tournaments/${tournamentId}/match/${matchId}`);
  },
  
  submitMatchResult: async (tournamentId, matchId, winnerId, proof = null, notes = null) => {
    console.log(`🏆 TournamentsAPI: Submitting result for match ${matchId} in tournament ${tournamentId}`);
    return await api.post(`/tournaments/${tournamentId}/matches/${matchId}/result`, {
      winnerId,
      proof,
      notes
    });
  },
  
  getStandings: async (tournamentId) => {
    console.log(`🏆 TournamentsAPI: Fetching standings for tournament ${tournamentId}`);
    return await api.get(`/tournaments/${tournamentId}/standings`);
  },
  
  getMyMatches: async (tournamentId) => {
    console.log(`🏆 TournamentsAPI: Fetching my matches in tournament ${tournamentId}`);
    return await api.get(`/tournaments/${tournamentId}/my-matches`);
  },
  
  kickParticipant: async (tournamentId, userId) => {
    console.log(`🏆 TournamentsAPI: Kicking participant ${userId} from tournament ${tournamentId}`);
    return await api.delete(`/tournaments/${tournamentId}/participants/${userId}`);
  },
  
  cancel: async (tournamentId) => {
    console.log(`🏆 TournamentsAPI: Cancelling tournament ${tournamentId}`);
    return await api.post(`/tournaments/${tournamentId}/cancel`);
  },
  
  getParticipants: async (tournamentId) => {
    console.log(`🏆 TournamentsAPI: Fetching participants for tournament ${tournamentId}`);
    return await api.get(`/tournaments/${tournamentId}/participants`);
  },
  
  leaveTournament: async (tournamentId) => {
    console.log(`🏆 TournamentsAPI: Leaving tournament ${tournamentId}`);
    return await api.post(`/tournaments/${tournamentId}/leave`);
  },
   getMatches: async (tournamentId) => {
    console.log(`🎮 TournamentsAPI: Fetching matches for tournament ${tournamentId}`);
    return await api.get(`/tournaments/${tournamentId}/matches`);
  },
   fixMatches: async (tournamentId) => {
    console.log(`🔧 TournamentsAPI: Fixing matches for tournament ${tournamentId}`);
    return await api.post(`/tournaments/${tournamentId}/fix-matches`);
  },
  manualAdvance: async (tournamentId, matchId, winnerId) => {
    console.log(`🔧 TournamentsAPI: Manually advancing winner ${winnerId} from match ${matchId}`);
    return await api.post(`/tournaments/${tournamentId}/manual-advance`, {
      match_id: matchId,
      winner_id: winnerId
    });
  },
  
  // NEW: Fix tournament matches
  fixMatches: async (tournamentId) => {
    console.log(`🔧 TournamentsAPI: Fixing matches for tournament ${tournamentId}`);
    return await api.post(`/tournaments/${tournamentId}/fix-matches`);
  }
};

// TO THIS (FIXED):
const leaderboardAPI = {
  // Get player leaderboard
  getPlayers: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/leaderboard/players${queryParams ? '?' + queryParams : ''}`);
  },

  // Get squad leaderboard
  getSquads: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/leaderboard/squads${queryParams ? '?' + queryParams : ''}`);
  },

  // Get recent winners
  getRecentWinners: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/leaderboard/recent-winners${queryParams ? '?' + queryParams : ''}`);
  },

  // Get live tournaments
  getLiveTournaments: () => {
    return api.get('/leaderboard/live-tournaments');
  },

  // Get survival champions
  getSurvivalChampions: () => {
    return api.get('/leaderboard/survival-champions');
  },

  // Get available games
  getGames: () => {
    return api.get('/leaderboard/games');
  },

  // Get user's position
  getUserPosition: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/leaderboard/user-position${queryParams ? '?' + queryParams : ''}`);
  }
};
// Matches API - COMPLETE WITH MATCH CHAT (ADDED MATCH CHAT METHODS HERE)
const matchesAPI = {
  createMatch: async (matchData) => {
    console.log('🎮 MatchesAPI: Creating match');
    const response = await api.post('/matches/create', matchData);
    return response;
  },
  
  getMatches: async () => {
    console.log('🎮 MatchesAPI: Fetching matches');
    return await api.get('/matches');
  },
  
  joinMatch: async (matchId) => {
    console.log(`🎮 MatchesAPI: Joining match ${matchId}`);
    return await api.post(`/matches/${matchId}/join`);
  },
  
  acceptInvitation: async (matchId) => {
    console.log(`🎮 MatchesAPI: Accepting match invitation ${matchId}`);
    return await api.post(`/matches/${matchId}/accept`);
  },
  
  declineInvitation: async (matchId) => {
    console.log(`🎮 MatchesAPI: Declining match invitation ${matchId}`);
    return await api.post(`/matches/${matchId}/decline`);
  },
  
  submitResult: async (matchId, winnerId) => {
    console.log(`🎮 MatchesAPI: Submitting result for match ${matchId}`);
    return await api.post(`/matches/${matchId}/result`, { winner_id: winnerId });
  },
  
  confirmResult: async (matchId, confirm) => {
    console.log(`🎮 MatchesAPI: ${confirm ? 'Confirming' : 'Contesting'} result for match ${matchId}`);
    return await api.post(`/matches/${matchId}/confirm`, { confirm });
  },
  
  cancelMatch: async (matchId) => {
    console.log(`🎮 MatchesAPI: Cancelling match ${matchId}`);
    return await api.post(`/matches/${matchId}/cancel`);
  },
  
  getMatchDetails: async (matchId) => {
    console.log(`🎮 MatchesAPI: Fetching match ${matchId}`);
    return await api.get(`/matches/${matchId}`);
  },
  
  // ============ ADDED MATCH CHAT METHODS HERE ============
  getMatchChat: async (matchId) => {
    try {
      console.log(`💬 MatchesAPI: Fetching match chat for ${matchId}`);
      const response = await api.get(`/matches/${matchId}/chat`);
      return response;
    } catch (error) {
      console.error('Error fetching match chat:', error);
      throw error;
    }
  },

  sendMatchChat: async (matchId, message) => {
    try {
      console.log(`💬 MatchesAPI: Sending match chat message to ${matchId}`);
      const response = await api.post(`/matches/${matchId}/chat`, { message });
      return response;
    } catch (error) {
      console.error('Error sending match chat message:', error);
      throw error;
    }
  },

  sendSystemMessage: async (matchId, message) => {
    try {
      console.log(`💬 MatchesAPI: Sending system message to match ${matchId}`);
      const response = await api.post(`/matches/${matchId}/chat/system`, { message });
      return response;
    } catch (error) {
      console.error('Error sending system message:', error);
      throw error;
    }
  }
};

// Groups API - COMPLETE
const groupsAPI = {
  getAll: async () => {
    console.log('👥 GroupsAPI: Fetching all groups');
    return await api.get('/groups');
  },
  
  getById: async (groupId) => {
    console.log(`👥 GroupsAPI: Fetching group ${groupId}`);
    return await api.get(`/groups/${groupId}`);
  },
  
  create: async (groupData) => {
    console.log('👥 GroupsAPI: Creating new group');
    return await api.post('/groups', groupData);
  },
  
  join: async (groupId) => {
    console.log(`👥 GroupsAPI: Joining group ${groupId}`);
    return await api.post(`/groups/${groupId}/join`);
  },
  
  leave: async (groupId) => {
    console.log(`👥 GroupsAPI: Leaving group ${groupId}`);
    return await api.post(`/groups/${groupId}/leave`);
  },
  
  update: async (groupId, groupData) => {
    console.log(`👥 GroupsAPI: Updating group ${groupId}`);
    return await api.put(`/groups/${groupId}`, groupData);
  },
  
  delete: async (groupId) => {
    console.log(`👥 GroupsAPI: Deleting group ${groupId}`);
    return await api.delete(`/groups/${groupId}`);
  },
  
  getMembers: async (groupId) => {
    console.log(`👥 GroupsAPI: Fetching members for group ${groupId}`);
    return await api.get(`/groups/${groupId}/members`);
  },
  
  addMember: async (groupId, userId) => {
    console.log(`👥 GroupsAPI: Adding member ${userId} to group ${groupId}`);
    return await api.post(`/groups/${groupId}/members`, { userId });
  },
  
  removeMember: async (groupId, userId) => {
    console.log(`👥 GroupsAPI: Removing member ${userId} from group ${groupId}`);
    return await api.delete(`/groups/${groupId}/members/${userId}`);
  }
};

// Friends API - COMPLETE
const friendsAPI = {
  getAll: async () => {
    console.log('🤝 FriendsAPI: Fetching all friends');
    return await api.get('/friends');
  },
  
  getRequests: async () => {
    console.log('🤝 FriendsAPI: Fetching friend requests');
    return await api.get('/friends/requests');
  },
  
  add: async (friendId) => {
    console.log(`🤝 FriendsAPI: Adding friend ${friendId}`);
    return await api.post(`/friends/${friendId}`);
  },
  
  remove: async (friendId) => {
    console.log(`🤝 FriendsAPI: Removing friend ${friendId}`);
    return await api.delete(`/friends/${friendId}`);
  },
  
  accept: async (requestId) => {
    console.log(`🤝 FriendsAPI: Accepting friend request ${requestId}`);
    return await api.post(`/friends/requests/${requestId}/accept`);
  },
  
  reject: async (requestId) => {
    console.log(`🤝 FriendsAPI: Rejecting friend request ${requestId}`);
    return await api.post(`/friends/requests/${requestId}/reject`);
  },
  
  search: async (query) => {
    console.log(`🤝 FriendsAPI: Searching for friends with query: ${query}`);
    return await api.get(`/friends/search?query=${encodeURIComponent(query)}`);
  }
};

// Chat API - COMPLETE (IMPORTANT FOR CHAT FEATURE)
const chatAPI = {
  getConversations: async () => {
    console.log('💬 ChatAPI: Fetching conversations');
    return await api.get('/chat/conversations');
  },
  
  getGroupConversations: async () => {
    console.log('💬 ChatAPI: Fetching group conversations');
    return await api.get('/chat/group-conversations');
  },
  
  getChatHistory: async (userId) => {
    console.log(`💬 ChatAPI: Fetching chat history with user ${userId}`);
    return await api.get(`/chat/history/${userId}`);
  },
  
  getGroupChatHistory: async (groupId) => {
    console.log(`💬 ChatAPI: Fetching group chat history for group ${groupId}`);
    return await api.get(`/chat/group/${groupId}/history`);
  },
  
  sendMessage: async (messageData) => {
    console.log('💬 ChatAPI: Sending message');
    return await api.post('/chat/send', messageData);
  },
  
  markMessagesAsRead: async (data) => {
    console.log('💬 ChatAPI: Marking messages as read');
    return await api.post('/chat/mark-read', data);
  },
  
  deleteMessage: async (messageId) => {
    console.log(`💬 ChatAPI: Deleting message ${messageId}`);
    return await api.delete(`/chat/message/${messageId}`);
  }
};

// Transactions API - COMPLETE
const transactionsAPI = {
  getAll: async () => {
    console.log('💰 TransactionsAPI: Fetching all transactions');
    return await api.get('/transactions');
  },
  
  deposit: async (amount, paymentMethod = 'card') => {
    console.log(`💰 TransactionsAPI: Depositing ${amount} via ${paymentMethod}`);
    return await api.post('/transactions/deposit', { amount, paymentMethod });
  },
  
  withdraw: async (amount, accountDetails) => {
    console.log('💰 TransactionsAPI: Processing withdrawal');
    return await api.post('/transactions/withdraw', { amount, accountDetails });
  },
  
  getBalance: async () => {
    console.log('💰 TransactionsAPI: Fetching balance');
    return await api.get('/transactions/balance');
  }
};

// Debug & Health API - COMPLETE
const debugAPI = {
  testConnection: async () => {
    console.log('🔧 DebugAPI: Testing connection');
    try {
      const response = await api.get('/health');
      return { success: true, data: response };
    } catch (error) {
      console.error('DebugAPI: Connection test failed:', error);
      return { 
        success: false, 
        error: error.message,
        status: error.status,
        data: error.data 
      };
    }
  },
  
  testAuth: async () => {
    console.log('🔧 DebugAPI: Testing authentication');
    try {
      const response = await api.get('/auth/test');
      return { success: true, data: response };
    } catch (error) {
      console.error('DebugAPI: Auth test failed:', error);
      return { 
        success: false, 
        error: error.message,
        status: error.status,
        data: error.data 
      };
    }
  },
  
  ping: async () => {
    console.log('🔧 DebugAPI: Pinging server');
    const start = Date.now();
    try {
      await api.get('/health');
      const latency = Date.now() - start;
      return { success: true, latency: `${latency}ms` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// System API - COMPLETE
const systemAPI = {
  getStats: async () => {
    console.log('📊 SystemAPI: Fetching system stats');
    return await api.get('/system/stats');
  },
  
  clearCache: async () => {
    console.log('🗑️ SystemAPI: Clearing cache');
    return await api.post('/system/clear-cache');
  },
  
  getLogs: async () => {
    console.log('📋 SystemAPI: Fetching logs');
    return await api.get('/system/logs');
  }
};

// Wallet API - CORRECTED VERSION
const walletAPI = {
  getBalance: async () => {
    console.log('💰 WalletAPI: Fetching wallet balance');
    return await api.get('/wallet/balance');
  },
  
  getTransactions: async (type, limit = 50) => {
    console.log('💰 WalletAPI: Fetching transactions');
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', limit);
    return await api.get(`/wallet/transactions?${params}`);
  },
  
  getXpTransactions: async (type, limit = 50) => {
    console.log('💰 WalletAPI: Fetching XP transactions');
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', limit);
    return await api.get(`/wallet/xp-transactions?${params}`);
  },
  
  initializePayment: async (amount, currency = 'NGN') => {
    console.log(`💰 WalletAPI: Initializing payment of ${amount} ${currency}`);
    return await api.post('/wallet/fund/initialize', { amount, currency });
  },
  
  transferFunds: async (recipientAccount, amount, pin, description) => {
    console.log(`💰 WalletAPI: Transferring ${amount} to ${recipientAccount}`);
    return await api.post('/wallet/transfer/funds', {
      recipient_account: recipientAccount,
      amount,
      pin,
      description
    });
  },
  
  convertToXp: async (amount, pin) => {
    console.log(`💰 WalletAPI: Converting ${amount} to XP`);
    return await api.post('/wallet/convert/to-xp', { amount, pin });
  },
  
  transferXp: async (recipientAccount, xpPoints, pin, description) => {
    console.log(`💰 WalletAPI: Transferring ${xpPoints} XP to ${recipientAccount}`);
    return await api.post('/wallet/transfer/xp', {
      recipient_account: recipientAccount,
      xp_points: xpPoints,
      pin,
      description
    });
  },
  
  requestWithdrawal: async (amount, bankDetails, pin) => {
    console.log(`💰 WalletAPI: Requesting withdrawal of ${amount}`);
    return await api.post('/wallet/withdraw/request', {
      amount,
      ...bankDetails,
      pin
    });
  },
  
  getBankDetails: async () => {
    console.log('💰 WalletAPI: Fetching bank details');
    return await api.get('/wallet/bank-details');
  },
  
  saveBankDetails: async (bankDetails) => {
    console.log('💰 WalletAPI: Saving bank details');
    return await api.post('/wallet/bank-details', bankDetails);
  },
  
  setTransactionPin: async (pin, confirmPin) => {
    console.log('💰 WalletAPI: Setting transaction PIN');
    return await api.post('/wallet/set-pin', { pin, confirm_pin: confirmPin });
  },
  
  verifyTransactionPin: async (pin) => {
    console.log('💰 WalletAPI: Verifying transaction PIN');
    return await api.post('/wallet/verify-pin', { pin });
  }
};

const adminAPI = {
  // Test admin connection
  testConnection: async () => {
    console.log('🔧 AdminAPI: Testing connection');
    try {
      const response = await adminApi.get('/admin/test');
      return { success: true, data: response };
    } catch (error) {
      console.error('AdminAPI: Connection test failed:', error);
      return { 
        success: false, 
        error: error.message,
        status: error.status,
        data: error.data 
      };
    }
  },
  
  // Admin login - uses adminApi which won't add user tokens
  login: async (username, password) => {
    console.log('🔐 AdminAPI: Admin login attempt');
    return await adminApi.post('/admin/login', { username, password });
  },
  
  // Test login endpoint (for debugging)
  testLogin: async (username, password) => {
    console.log('🔐 AdminAPI: Admin test login attempt');
    return await adminApi.post('/admin/login-test', { username, password });
  },
  
  getDashboardStats: async () => {
    console.log('📊 AdminAPI: Fetching dashboard stats');
    return await adminApi.get('/admin/dashboard/stats');
  },
  
  getWithdrawals: async (status = 'pending', page = 1, limit = 20) => {
    console.log(`📋 AdminAPI: Fetching ${status} withdrawals`);
    return await adminApi.get(`/admin/withdrawals?status=${status}&page=${page}&limit=${limit}`);
  },
  
  getWithdrawalDetails: async (id) => {
    console.log(`📋 AdminAPI: Fetching withdrawal ${id} details`);
    return await adminApi.get(`/admin/withdrawals/${id}`);
  },
  
  processWithdrawal: async (id, action, notes) => {
    console.log(`📋 AdminAPI: ${action} withdrawal ${id}`);
    return await adminApi.post(`/admin/withdrawals/${id}/action`, { action, notes });
  },
  
  getUsers: async (search = '', page = 1, limit = 20) => {
    console.log(`👥 AdminAPI: Fetching users, search: ${search}`);
    return await adminApi.get(`/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
  },
  
  getUserDetails: async (id) => {
    console.log(`👥 AdminAPI: Fetching user ${id} details`);
    return await adminApi.get(`/admin/users/${id}`);
  },
  
  // User Management
  updateUser: async (id, userData) => {
    console.log(`👥 AdminAPI: Updating user ${id}`);
    return await adminApi.put(`/admin/users/${id}`, userData);
  },
  
  toggleUserBan: async (id, isBanned, reason = '') => {
    console.log(`👥 AdminAPI: ${isBanned ? 'Banning' : 'Unbanning'} user ${id}`);
    return await adminApi.post(`/admin/users/${id}/ban`, { isBanned, reason });
  },
  
  deleteUser: async (id) => {
    console.log(`👥 AdminAPI: Deleting user ${id}`);
    return await adminApi.delete(`/admin/users/${id}`);
  },
  
  updateUserBalance: async (id, amount, reason = '') => {
    console.log(`👥 AdminAPI: Updating balance for user ${id}`);
    return await adminApi.post(`/admin/users/${id}/balance`, { amount, reason });
  },
  
  getUserStats: async (id) => {
    console.log(`👥 AdminAPI: Fetching stats for user ${id}`);
    return await adminApi.get(`/admin/users/${id}/stats`);
  },
  
  getTransactions: async (type = '', status = '', page = 1, limit = 50, search = '') => {
    console.log(`💰 AdminAPI: Fetching transactions - Type: ${type}, Status: ${status}, Search: ${search}`);
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    return await adminApi.get(`/admin/transactions?${params}`);
  },
  
  getTransactionDetails: async (id) => {
    console.log(`💰 AdminAPI: Fetching transaction ${id} details`);
    return await adminApi.get(`/admin/transactions/${id}`);
  },
  
  updateTransactionStatus: async (id, status, notes = '') => {
    console.log(`💰 AdminAPI: Updating transaction ${id} status to ${status}`);
    return await adminApi.put(`/admin/transactions/${id}/status`, { status, notes });
  },
  
  refundTransaction: async (id, reason = '') => {
    console.log(`💰 AdminAPI: Refunding transaction ${id}`);
    return await adminApi.post(`/admin/transactions/${id}/refund`, { reason });
  },
  
  getTransactionStats: async (period = 'today') => {
    console.log(`💰 AdminAPI: Fetching transaction stats for ${period}`);
    return await adminApi.get(`/admin/transactions/stats?period=${period}`);
  },
  
  // Matches Management
  getMatches: async (status = '', game_type = '', admin_monitoring = '', page = 1, limit = 20, search = '') => {
    console.log(`🎮 AdminAPI: Fetching matches - Status: ${status}, Game Type: ${game_type}, Admin Monitoring: ${admin_monitoring}, Page: ${page}`);
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (game_type) params.append('game_type', game_type);
    if (admin_monitoring) params.append('admin_monitoring', admin_monitoring);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    return await adminApi.get(`/admin/matches?${params}`);
  },
  
  getMatchDetails: async (id) => {
    console.log(`🎮 AdminAPI: Fetching match ${id} details`);
    return await adminApi.get(`/admin/matches/${id}`);
  },
  
  updateMatch: async (id, matchData) => {
    console.log(`🎮 AdminAPI: Updating match ${id}`);
    return await adminApi.put(`/admin/matches/${id}`, matchData);
  },
  
  resolveMatchDispute: async (id, winnerId, adminNotes = '') => {
    console.log(`🎮 AdminAPI: Resolving dispute for match ${id}`);
    return await adminApi.post(`/admin/matches/${id}/resolve`, { winnerId, adminNotes });
  },
  
  cancelMatch: async (id, reason = '') => {
    console.log(`🎮 AdminAPI: Cancelling match ${id}`);
    return await adminApi.post(`/admin/matches/${id}/cancel`, { reason });
  },
  
  getMatchStats: async () => {
    console.log(`🎮 AdminAPI: Fetching match stats`);
    return await adminApi.get(`/admin/matches/stats`);
  },
  
  getTournaments: async (status = '', type = '', page = 1, limit = 20, search = '', monitoring = '', sort = 'newest') => {
  console.log(`🏆 AdminAPI: Fetching tournaments - Status: ${status}, Type: ${type}, Monitoring: ${monitoring}, Sort: ${sort}`);
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  if (monitoring) params.append('monitoring', monitoring);
  if (sort) params.append('sort', sort);
  if (search) params.append('search', search);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  return await adminApi.get(`/admin/tournaments?${params}`);
},
  
  getTournamentStats: async () => {
    console.log(`🏆 AdminAPI: Fetching tournament stats`);
    return await adminApi.get(`/admin/tournaments/stats`);
  },
  
  getTournamentDetails: async (id) => {
    console.log(`🏆 AdminAPI: Fetching tournament ${id} details`);
    return await adminApi.get(`/admin/tournaments/${id}`);
  },
  
  updateTournament: async (id, tournamentData) => {
    console.log(`🏆 AdminAPI: Updating tournament ${id}`);
    return await adminApi.put(`/admin/tournaments/${id}`, tournamentData);
  },
  
  cancelTournament: async (id, reason = '') => {
    console.log(`🏆 AdminAPI: Cancelling tournament ${id}`);
    return await adminApi.post(`/admin/tournaments/${id}/cancel`, { reason });
  },
  
  distributeTournamentPrizes: async (id) => {
    console.log(`🏆 AdminAPI: Distributing prizes for tournament ${id}`);
    return await adminApi.post(`/admin/tournaments/${id}/distribute-prizes`);
  },
  
  getTournamentParticipants: async (id) => {
    console.log(`🏆 AdminAPI: Fetching participants for tournament ${id}`);
    return await adminApi.get(`/admin/tournaments/${id}/participants`);
  },
  
  removeTournamentParticipant: async (tournamentId, userId, reason = '') => {
    console.log(`🏆 AdminAPI: Removing participant ${userId} from tournament ${tournamentId}`);
    return await adminApi.delete(`/admin/tournaments/${tournamentId}/participants/${userId}`, { data: { reason } });
  },
  
  getTournamentMatches: async (id) => {
    console.log(`🏆 AdminAPI: Fetching matches for tournament ${id}`);
    return await adminApi.get(`/admin/tournaments/${id}/matches`);
  },
  
  // Admin monitoring endpoints - FIXED: All using adminApi
  getMonitoredTournaments: async () => {
    console.log(`🛡️ AdminAPI: Fetching monitored tournaments`);
    return await adminApi.get(`/admin/monitored-tournaments`);
  },
  
  getMonitoringLogs: async (tournamentId) => {
    console.log(`📝 AdminAPI: Fetching monitoring logs for tournament ${tournamentId}`);
    return await adminApi.get(`/admin/tournaments/${tournamentId}/monitoring-logs`);
  },
  
  getMonitoringStats: async (tournamentId) => {
    console.log(`📊 AdminAPI: Fetching monitoring stats for tournament ${tournamentId}`);
    return await adminApi.get(`/admin/tournaments/${tournamentId}/monitoring-stats`);
  },
  
  // Groups Management
  getGroups: async (search = '', page = 1, limit = 20) => {
    console.log(`👥 AdminAPI: Fetching groups`);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    return await adminApi.get(`/admin/groups?${params}`);
  },
  
  getGroupDetails: async (id) => {
    console.log(`👥 AdminAPI: Fetching group ${id} details`);
    return await adminApi.get(`/admin/groups/${id}`);
  },
  
  updateGroup: async (id, groupData) => {
    console.log(`👥 AdminAPI: Updating group ${id}`);
    return await adminApi.put(`/admin/groups/${id}`, groupData);
  },
  
  deleteGroup: async (id, reason = '') => {
    console.log(`👥 AdminAPI: Deleting group ${id}`);
    return await adminApi.delete(`/admin/groups/${id}`, { data: { reason } });
  },
  
  getGroupMembers: async (id) => {
    console.log(`👥 AdminAPI: Fetching members for group ${id}`);
    return await adminApi.get(`/admin/groups/${id}/members`);
  },
  
  // System Settings
  getSettings: async () => {
    console.log(`⚙️ AdminAPI: Fetching system settings`);
    return await adminApi.get(`/admin/settings`);
  },
  
  updateSetting: async (key, value) => {
    console.log(`⚙️ AdminAPI: Updating setting ${key}`);
    return await adminApi.post(`/admin/settings/${key}`, { value });
  },
  
  updateMultipleSettings: async (settings) => {
    console.log(`⚙️ AdminAPI: Updating multiple settings`);
    return await adminApi.post(`/admin/settings/update-multiple`, { settings });
  },
  
  getXpRates: async () => {
    console.log(`⚙️ AdminAPI: Fetching XP rates`);
    return await adminApi.get(`/admin/settings/xp-rates`);
  },
  
  updateXpRate: async (currency, rate) => {
    console.log(`⚙️ AdminAPI: Updating XP rate for ${currency}`);
    return await adminApi.post(`/admin/settings/xp-rates/${currency}`, { rate });
  },
  
  // Fraud Detection
  getFraudFlags: async (status = 'pending', page = 1, limit = 20) => {
    console.log(`🚨 AdminAPI: Fetching fraud flags`);
    return await adminApi.get(`/admin/fraud/flags?status=${status}&page=${page}&limit=${limit}`);
  },
  
  getFlagDetails: async (id) => {
    console.log(`🚨 AdminAPI: Fetching fraud flag ${id} details`);
    return await adminApi.get(`/admin/fraud/flags/${id}`);
  },
  
  updateFlagStatus: async (id, status, notes = '') => {
    console.log(`🚨 AdminAPI: Updating fraud flag ${id} status to ${status}`);
    return await adminApi.put(`/admin/fraud/flags/${id}/status`, { status, notes });
  },
  
  getSuspiciousUsers: async () => {
    console.log(`🚨 AdminAPI: Fetching suspicious users`);
    return await adminApi.get(`/admin/fraud/suspicious-users`);
  },
  
  getFraudStats: async () => {
    console.log(`🚨 AdminAPI: Fetching fraud stats`);
    return await adminApi.get(`/admin/fraud/stats`);
  },
  
  // Reports
  generateReport: async (type, startDate, endDate, format = 'json') => {
    console.log(`📊 AdminAPI: Generating ${type} report`);
    return await adminApi.post(`/admin/reports/generate`, { type, startDate, endDate, format });
  },
  
  getReportHistory: async () => {
    console.log(`📊 AdminAPI: Fetching report history`);
    return await adminApi.get(`/admin/reports/history`);
  },
  
  // Analytics
  getAnalytics: async (period = '30d') => {
    console.log(`📈 AdminAPI: Fetching analytics for ${period}`);
    return await adminApi.get(`/admin/analytics?period=${period}`);
  },
  
  // Admin Management
  getAdmins: async () => {
    console.log(`👑 AdminAPI: Fetching admins`);
    return await adminApi.get(`/admin/admins`);
  },
  
  createAdmin: async (adminData) => {
    console.log(`👑 AdminAPI: Creating admin`);
    return await adminApi.post(`/admin/admins`, adminData);
  },
  
  updateAdminPermissions: async (id, permissions) => {
    console.log(`👑 AdminAPI: Updating admin ${id} permissions`);
    return await adminApi.put(`/admin/admins/${id}/permissions`, { permissions });
  },
  
  deleteAdmin: async (id) => {
    console.log(`👑 AdminAPI: Deleting admin ${id}`);
    return await adminApi.delete(`/admin/admins/${id}`);
  },
  
  getAdminLogs: async (adminId = '', page = 1, limit = 50) => {
    console.log(`👑 AdminAPI: Fetching admin logs`);
    const params = new URLSearchParams();
    if (adminId) params.append('adminId', adminId);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    return await adminApi.get(`/admin/logs?${params}`);
  },
  
  // System Maintenance
  clearCache: async (type = 'all') => {
    console.log(`🛠️ AdminAPI: Clearing ${type} cache`);
    return await adminApi.post(`/admin/maintenance/clear-cache`, { type });
  },
  
  backupDatabase: async () => {
    console.log(`🛠️ AdminAPI: Backing up database`);
    return await adminApi.post(`/admin/maintenance/backup`);
  },
  
  getSystemHealth: async () => {
    console.log(`🛠️ AdminAPI: Fetching system health`);
    return await adminApi.get(`/admin/maintenance/health`);
  },
  getGames: async (category = '', is_active = '', search = '') => {
    console.log(`🎮 AdminAPI: Fetching games - Category: ${category}, Active: ${is_active}, Search: ${search}`);
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (is_active !== '') params.append('is_active', is_active);
    if (search) params.append('search', search);
    return await adminApi.get(`/admin/games?${params}`);
  },
  
  addGame: async (gameData) => {
    console.log('🎮 AdminAPI: Adding new game');
    return await adminApi.post('/admin/games', gameData);
  },
  
  updateGame: async (id, gameData) => {
    console.log(`🎮 AdminAPI: Updating game ${id}`);
    return await adminApi.put(`/admin/games/${id}`, gameData);
  },
  
  deleteGame: async (id) => {
    console.log(`🎮 AdminAPI: Deleting game ${id}`);
    return await adminApi.delete(`/admin/games/${id}`);
  },
  
  // Broadcast Message
  broadcastMessage: async (message) => {
    console.log('📢 AdminAPI: Broadcasting message');
    return await adminApi.post('/admin/broadcast-message', { message });
  },
  
  // System Health
  getSystemHealth: async () => {
    console.log('🔧 AdminAPI: Fetching system health');
    return await adminApi.get('/admin/maintenance/health');
  },

  
  // Logout admin (client-side only)
  logout: () => {
    console.log('🚪 AdminAPI: Logging out admin');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  }
};
// Dashboard-specific API calls
export const dashboardAPI = {
  // Get dashboard stats
  getDashboardStats: async () => {
    return api.get('/api/dashboard/stats');
  },
  
  // Get live tournaments
  getLiveTournaments: async () => {
    return api.get('/api/tournaments/live');
  },
  
  // Get recent activity
  getRecentActivity: async (userId) => {
    return api.get(`/api/users/${userId}/activity`);
  },
  
  // Get user tournaments (for win count)
  getUserTournaments: async () => {
    return api.get('/api/tournaments/my-tournaments');
  }
};
// Notifications API - UPDATED to match new backend structure
const notificationsAPI = {
  // Get notifications (updated parameters)
  getNotifications: async (type = null, status = null, page = 1, limit = 20) => {
    console.log('🔔 NotificationsAPI: Fetching notifications');
    const params = new URLSearchParams();
    if (type && type !== 'all') params.append('type', type);
    if (status) params.append('status', status);
    params.append('page', page);
    params.append('limit', limit);
    return await api.get(`/notifications?${params}`);
  },
  
  // Debug endpoint to see raw data
  debugAll: async () => {
    console.log('🔔 NotificationsAPI: Debug fetch');
    return await api.get('/notifications/debug/all');
  },
  
  // Mark as read
  markAsRead: async (notificationId) => {
    console.log(`🔔 NotificationsAPI: Marking notification ${notificationId} as read`);
    return await api.put(`/notifications/${notificationId}/read`);
  },
  
  // Mark all as read (updated endpoint name)
  markAllAsRead: async () => {
    console.log('🔔 NotificationsAPI: Marking all notifications as read');
    return await api.put('/notifications/mark-all-read');
  },
  
  // Delete notification
  deleteNotification: async (notificationId) => {
    console.log(`🔔 NotificationsAPI: Deleting notification ${notificationId}`);
    return await api.delete(`/notifications/${notificationId}`);
  },
  
  // Get notification counts
  getNotificationCounts: async () => {
    console.log('🔔 NotificationsAPI: Fetching notification counts');
    return await api.get('/notifications/counts');
  },

  // Accept invitation (simplified)
  acceptInvitation: async (notificationId) => {
    console.log(`🔔 NotificationsAPI: Accepting invitation ${notificationId}`);
    return await api.post(`/notifications/${notificationId}/accept`);
  },

  // Reject invitation (updated)
  rejectInvitation: async (notificationId) => {
    console.log(`🔔 NotificationsAPI: Rejecting invitation ${notificationId}`);
    return await api.post(`/notifications/${notificationId}/reject`);
  },

  // Create test notification
  createTestNotification: async (message, type = 'system') => {
    console.log(`🔔 NotificationsAPI: Creating test notification`);
    return await api.post('/notifications/test', { message, type });
  },

  // Clear all notifications
  clearAll: async () => {
    console.log('🔔 NotificationsAPI: Clearing all notifications');
    return await api.delete('/notifications');
  }
};

// ==================== EXPORT HELPER FUNCTIONS ====================

// Helper function to check if API is reachable
const checkAPIConnection = async () => {
  console.log('🌐 Checking API connection...');
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000
    });
    console.log('✅ API Connection successful:', response.data);
    return { connected: true, data: response.data };
  } catch (error) {
    console.error('❌ API Connection failed:', error.message);
    return { 
      connected: false, 
      error: error.message,
      suggestion: 'Make sure backend server is running on port 5000'
    };
  }
};

// Helper function to check admin authentication
const checkAdminAuth = () => {
  const adminToken = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('adminData');
  
  return {
    isAuthenticated: !!adminToken,
    adminData: adminData ? JSON.parse(adminData) : null,
    adminToken: adminToken
  };
};

// Helper function to clear all auth
const clearAllAuth = () => {
  console.log('🧹 Clearing all authentication data');
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  sessionStorage.clear();
};

// ==================== SINGLE EXPORT SECTION ====================

// Export everything in ONE PLACE to avoid duplicate exports
export {
  // Main API instances
  api,
  adminApi,
  
  // All API modules
  authAPI,
  usersAPI,
  tournamentsAPI,
  matchesAPI, // Now includes match chat methods
  groupsAPI,
  friendsAPI,
  chatAPI,
  transactionsAPI,
  walletAPI,
  notificationsAPI,
  debugAPI,
  systemAPI,
  adminAPI,
  leaderboardAPI,
  
  // Helper functions
  checkAPIConnection,
  checkAdminAuth,
  clearAllAuth
};

// Export default api for backward compatibility
export default api;