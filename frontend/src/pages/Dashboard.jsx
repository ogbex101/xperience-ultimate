import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  TrendingUp, 
  Target,
  Gamepad2,
  Clock,
  ChevronRight,
  Calendar,
  Award,
  BarChart3,
  Crown,
  Users,
  Zap,
  TrendingDown,
  Shield,
  Star,
  Swords,
  Coins,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { usersAPI, tournamentsAPI, matchesAPI } from "../utils/api.js";

// Rank utilities
const getRankColor = (rank) => {
  const rankColors = {
    'SSS': 'linear-gradient(135deg, #FFD700, #B8860B)',
    'SS': 'linear-gradient(135deg, #C0C0C0, #808080)',
    'S': 'linear-gradient(135deg, #FF4500, #8B0000)',
    'A': 'linear-gradient(135deg, #8A2BE2, #4B0082)',
    'B': 'linear-gradient(135deg, #4169E1, #000080)',
    'C': 'linear-gradient(135deg, #32CD32, #006400)',
    'D': 'linear-gradient(135deg, #FF69B4, #C71585)',
    'E': 'linear-gradient(135deg, #FFA500, #FF8C00)'
  };
  return rankColors[rank] || 'linear-gradient(135deg, #6366F1, #8B5CF6)';
};

const getRankIcon = (rank) => {
  const rankIcons = {
    'SSS': '👑',
    'SS': '💎',
    'S': '🔥',
    'A': '⚡',
    'B': '🌟',
    'C': '⭐',
    'D': '🛡️',
    'E': '🎯'
  };
  return rankIcons[rank] || '🎮';
};

const getRankName = (rank) => {
  const rankNames = {
    'SSS': 'Supreme Supreme Supreme',
    'SS': 'Supreme Supreme',
    'S': 'Supreme',
    'A': 'Elite',
    'B': 'Advanced',
    'C': 'Intermediate',
    'D': 'Beginner',
    'E': 'Novice'
  };
  return rankNames[rank] || 'Unknown Rank';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [stats, setStats] = useState({
    tournaments_won: 0,
    matches_played: 0,
    win_rate: 0,
    rank: 'E',
    xp_points: 0,
    wins: 0,
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
  });

  useEffect(() => {
    // Get user ID from token or localStorage
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      console.log('No auth found, redirecting to login');
      navigate('/login');
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile to get userId...');
      const response = await usersAPI.getProfileWithXp();
      
      if (response && response.user && response.user.id) {
        const userId = response.user.id;
        console.log('Got userId from profile:', userId);
        localStorage.setItem('userId', userId.toString());
        setUserId(userId);
        fetchDashboardData(userId);
      } else if (response && response.data && response.data.user && response.data.user.id) {
        const userId = response.data.user.id;
        console.log('Got userId from profile:', userId);
        localStorage.setItem('userId', userId.toString());
        setUserId(userId);
        fetchDashboardData(userId);
      } else {
        console.error('No user data in profile response:', response);
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      navigate('/login');
    }
  };

  const fetchDashboardData = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Fetching dashboard data for user:', userId);
      
      // Initialize with default stats
      let newStats = getDefaultStats();
      
      // 1. Fetch user stats from the dashboard API endpoint
      try {
        console.log('📊 Fetching user dashboard stats...');
        const dashboardResponse = await usersAPI.getDashboardData(userId);
        console.log('✅ Dashboard API response:', dashboardResponse);
        
        if (dashboardResponse && dashboardResponse.user) {
          newStats = {
            ...newStats,
            tournaments_won: parseInt(dashboardResponse.user.tournaments_won) || 0,
            matches_played: parseInt(dashboardResponse.user.matches_played) || 0,
            win_rate: parseFloat(dashboardResponse.user.win_rate) || 0,
            wins: parseInt(dashboardResponse.user.wins) || 0,
            rank: dashboardResponse.user.rank || 'E',
            xp_points: parseInt(dashboardResponse.user.xp_points) || 0
          };
        } else if (dashboardResponse && dashboardResponse.data) {
          newStats = {
            ...newStats,
            tournaments_won: parseInt(dashboardResponse.data.tournaments_won) || 0,
            matches_played: parseInt(dashboardResponse.data.matches_played) || 0,
            win_rate: parseFloat(dashboardResponse.data.win_rate) || 0,
            wins: parseInt(dashboardResponse.data.wins) || 0,
            rank: dashboardResponse.data.rank || 'E',
            xp_points: parseInt(dashboardResponse.data.xp_points) || 0
          };
        }
      } catch (dashboardError) {
        console.log('⚠️ Dashboard API failed, trying getUserStats:', dashboardError.message);
        
        // Fallback to getUserStats
        try {
          const statsResponse = await usersAPI.getUserStats(userId);
          console.log('✅ User stats response:', statsResponse);
          
          if (statsResponse && statsResponse.data) {
            newStats = {
              ...newStats,
              tournaments_won: parseInt(statsResponse.data.tournaments_won) || 0,
              matches_played: parseInt(statsResponse.data.matches_played) || 0,
              win_rate: parseFloat(statsResponse.data.win_rate) || 0,
              wins: parseInt(statsResponse.data.wins) || 0,
              rank: statsResponse.data.rank || 'E',
              xp_points: parseInt(statsResponse.data.xp_points) || 0
            };
          }
        } catch (statsError) {
          console.log('⚠️ Both dashboard endpoints failed:', statsError.message);
        }
      }
      
      // 2. Update last seen
      try {
        console.log('🕒 Updating last seen...');
        await usersAPI.updateLastSeen();
        console.log('✅ Last seen updated');
      } catch (lastSeenError) {
        console.log('⚠️ Update last seen failed:', lastSeenError.message);
      }
      
      // 3. Fetch recent activity (using matches history as fallback)
try {
  console.log('📈 Fetching recent matches as activity...');
  const matchesResponse = await matchesAPI.getUserMatches(userId, { limit: 5 });
  if (matchesResponse && matchesResponse.data) {
    newStats.recent_activity = matchesResponse.data.map(match => ({
      id: match.id,
      type: match.winner_id === userId ? 'win' : 'loss',
      description: match.winner_id === userId 
        ? `Won against ${match.opponent_name || 'opponent'}`
        : `Lost to ${match.opponent_name || 'opponent'}`,
      game: match.game || 'Unknown Game',
      timestamp: match.ended_at || match.created_at,
      xp: match.xp_earned || 0
    }));
  }
} catch (activityError) {
  console.log('⚠️ Activity fetch failed, creating mock data:', activityError.message);
  // Create mock recent activity based on stats
  newStats.recent_activity = [
    {
      id: 1,
      type: 'win',
      description: `Won a ranked match`,
      game: 'Gaming Platform',
      timestamp: new Date().toISOString(),
      xp: 25
    },
    {
      id: 2,
      type: 'activity',
      description: `Completed daily challenge`,
      game: 'Gaming Platform',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      xp: 50
    }
  ];
}
      
      // 4. Fetch live tournaments
      try {
        console.log('🎮 Fetching live tournaments...');
        const tournamentsResponse = await tournamentsAPI.getUserTournaments(userId);
        if (tournamentsResponse && tournamentsResponse.data) {
          newStats.live_tournaments = tournamentsResponse.data
            .filter(t => t.status === 'active')
            .slice(0, 3) || [];
        }
      } catch (tournamentsError) {
        console.log('⚠️ Tournaments fetch failed:', tournamentsError.message);
      }
      
      // Calculate rank progress
      newStats.rank_progress = calculateRankProgress(newStats);
      
      // Update state
      console.log('📈 Final stats:', newStats);
      setStats(newStats);
      
    } catch (error) {
      console.error('❌ Error in fetchDashboardData:', error);
      setError('Failed to load dashboard data. Showing limited information.');
      setStats(getDefaultStats());
    } finally {
      setLoading(false);
    }
  };

 const calculateRankProgress = (statsData) => {
  const currentRank = statsData.rank || 'E';
  const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
  const currentIndex = rankOrder.indexOf(currentRank);
  const nextRank = currentIndex < rankOrder.length - 1 ? rankOrder[currentIndex + 1] : null;
  
  // Calculate based on user stats (SAME LOGIC AS PROFILE PAGE)
  const wins = statsData.wins || 0;
  const matches = statsData.matches_played || 0;
  const winRate = statsData.win_rate || 0;
  
  const winsProgress = Math.min(100, (wins / 10) * 100);
  const matchesProgress = Math.min(100, (matches / 20) * 100);
  const winRateProgress = Math.min(100, (winRate / 50) * 100);
  const overallProgress = Math.round((winsProgress + matchesProgress + winRateProgress) / 3);
  
  const requirementsMet = [
    wins >= 10 ? 1 : 0,
    matches >= 20 ? 1 : 0,
    winRate >= 50 ? 1 : 0
  ].reduce((a, b) => a + b, 0);
  
  return {
    current: currentRank,
    next: nextRank,
    progress: overallProgress,
    wins_needed: 10,
    matches_needed: 20,
    win_rate_needed: 50,
    wins_current: wins,
    matches_current: matches,
    win_rate_current: winRate,
    wins_progress: winsProgress,
    matches_progress: matchesProgress,
    win_rate_progress: winRateProgress,
    requirements_met: requirementsMet,
    total_requirements: 3,
    can_rank_up: requirementsMet === 3 && nextRank !== null
  };
};

  const getDefaultStats = () => {
    return {
      tournaments_won: 0,
      matches_played: 0,
      win_rate: 0,
      wins: 0,
      rank: 'E',
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
    };
  };

  const quickStats = [
    {
      label: 'Tournaments Won',
      value: stats.tournaments_won,
      icon: Trophy,
      color: 'from-yellow-500 to-amber-600',
      iconColor: 'text-yellow-400',
      onClick: () => navigate('/tournaments?filter=won')
    },
    {
      label: 'Matches Played',
      value: stats.matches_played,
      icon: Gamepad2,
      color: 'from-blue-500 to-indigo-600',
      iconColor: 'text-blue-400',
      onClick: () => navigate('/matches')
    },
    {
      label: 'Win Rate',
      value: `${stats.win_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      iconColor: 'text-green-400',
      trend: stats.win_rate > 50 ? 'up' : 'down'
    },
    {
      label: 'Current Rank',
      value: stats.rank,
      icon: Crown,
      color: 'from-purple-500 to-violet-700',
      iconColor: 'text-purple-400',
      onClick: () => navigate('/profile')
    }
  ];

  const handleCreateTournament = () => {
    navigate('/tournaments/create');
  };

  const handleFindMatch = () => {
    navigate('/matches/create');
  };

  const handleJoinTournament = () => {
    navigate('/tournaments');
  };

  const handleViewLeaderboard = () => {
    navigate('/leaderboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <div className="h-9 bg-gray-800 rounded-lg w-48 mb-3"></div>
                <div className="h-4 bg-gray-800 rounded-lg w-64"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-11 bg-gray-800 rounded-lg w-48"></div>
                <div className="h-11 bg-gray-800 rounded-lg w-40"></div>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="h-5 bg-gray-700 rounded-lg w-32 mb-6"></div>
                  <div className="h-9 bg-gray-700 rounded-lg w-20"></div>
                </div>
              ))}
            </div>
            
            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="h-7 bg-gray-700 rounded-lg w-40 mb-6"></div>
                  <div className="h-3 bg-gray-700 rounded-full w-full mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-700/30 rounded-lg p-4">
                        <div className="h-4 bg-gray-700 rounded-lg w-24 mb-3"></div>
                        <div className="h-6 bg-gray-700 rounded-lg w-16"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="h-7 bg-gray-700 rounded-lg w-48 mb-6"></div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-gray-700/30 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Limited Dashboard Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Basic stats are available. Some features may be limited.
          </p>
          <button
            onClick={() => userId && fetchDashboardData(userId)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">Welcome back! Here's your gaming overview.</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={handleCreateTournament}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              Create Tournament
            </button>
            <button
              onClick={handleFindMatch}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
            >
              <Gamepad2 className="w-5 h-5" />
              Find Match
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 backdrop-blur-sm border border-gray-700/30 hover:border-gray-600/50 transition-all cursor-pointer hover:transform hover:scale-[1.02]`}
              onClick={stat.onClick}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                {stat.trend && (
                  <div className={`flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-medium">2.5%</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-300 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">
                  {stat.label === 'Win Rate' ? stat.value : stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Rank Progress & Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
          {/* Rank Progress */}
<div className="bg-white rounded-xl p-6 shadow-sm">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900">Rank Progress</h2>
      <p className="text-gray-600">Progress to next rank</p>
    </div>
    <div className="flex items-center gap-2">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ background: getRankColor(stats.rank) }}
      >
        {getRankIcon(stats.rank)}
      </div>
      <div>
        <p className="font-medium">{getRankName(stats.rank)}</p>
        <p className="text-sm text-gray-500">Rank {stats.rank}</p>
      </div>
    </div>
  </div>

  {/* Progress Bar - UPDATED */}
  <div className="mb-6">
    <div className="flex justify-between text-sm text-gray-600 mb-2">
      <span>{stats.rank}</span>
      <span>{stats.rank_progress.next || 'MAX'}</span>
    </div>
    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
        style={{ width: `${stats.rank_progress.progress}%` }}
      ></div>
    </div>
    <p className="text-sm text-gray-500 mt-2">
      {stats.rank_progress.progress}% to next rank • {stats.rank_progress.requirements_met}/{stats.rank_progress.total_requirements} requirements met
    </p>
  </div>

  {/* Requirements - UPDATED TO MATCH PROFILE PAGE */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Target className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="text-sm text-gray-600">Wins Needed</p>
          <p className="text-lg font-bold text-gray-900">
            {stats.rank_progress.wins_current}/{stats.rank_progress.wins_needed}
          </p>
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${stats.rank_progress.wins_progress}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-500 text-right mt-1">
        {stats.rank_progress.wins_progress.toFixed(1)}%
      </div>
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-green-100 rounded-lg">
          <Gamepad2 className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p className="text-sm text-gray-600">Matches Needed</p>
          <p className="text-lg font-bold text-gray-900">
            {stats.rank_progress.matches_current}/{stats.rank_progress.matches_needed}
          </p>
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full"
          style={{ width: `${stats.rank_progress.matches_progress}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-500 text-right mt-1">
        {stats.rank_progress.matches_progress.toFixed(1)}%
      </div>
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-purple-100 rounded-lg">
          <TrendingUp className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <p className="text-sm text-gray-600">Win Rate Needed</p>
          <p className="text-lg font-bold text-gray-900">
            {stats.rank_progress.win_rate_current.toFixed(1)}%/{stats.rank_progress.win_rate_needed}%
          </p>
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full"
          style={{ width: `${stats.rank_progress.win_rate_progress}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-500 text-right mt-1">
        {stats.rank_progress.win_rate_progress.toFixed(1)}%
      </div>
    </div>
  </div>

  {/* Rank Up Status - ADDED */}
  {stats.rank_progress.can_rank_up && (
    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-500" size={24} />
          <div>
            <h3 className="font-bold text-gray-900">Ready to Rank Up!</h3>
            <p className="text-sm text-gray-600">
              You meet all requirements for {stats.rank_progress.next} rank
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all">
          Claim Rank Up
        </button>
      </div>
    </div>
  )}
</div>

            {/* Recent Activity */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                  <p className="text-gray-400">Your latest matches and tournaments</p>
                </div>
                <button
                  onClick={() => navigate('/activity')}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {stats.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_activity.slice(0, 5).map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors border border-gray-700/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'win' ? 'bg-green-500/20' :
                          activity.type === 'loss' ? 'bg-red-500/20' : 'bg-blue-500/20'
                        }`}>
                          {activity.type === 'win' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : activity.type === 'loss' ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <Activity className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{activity.description}</p>
                          <p className="text-sm text-gray-400">{activity.game} • {new Date(activity.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {activity.xp > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400 font-medium">
                          <Coins className="w-4 h-4" />
                          +{activity.xp} XP
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-600/50">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-4">No recent activity</p>
                  <button
                    onClick={handleFindMatch}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Start Playing
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Live Tournaments & Quick Actions */}
          <div className="space-y-8">
            {/* Live Tournaments */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Live Tournaments</h2>
                  <p className="text-gray-400">Tournaments you're participating in</p>
                </div>
                <button
                  onClick={handleJoinTournament}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  Join More
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {stats.live_tournaments && stats.live_tournaments.length > 0 ? (
                <div className="space-y-4">
                  {stats.live_tournaments.slice(0, 3).map((tournament, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg border border-blue-700/30 hover:border-blue-600/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tournaments/${tournament.id}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-white">{tournament.name}</h3>
                          <p className="text-sm text-gray-400">{tournament.game}</p>
                        </div>
                        <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                          {tournament.type}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-400">Prize Pool</p>
                          <p className="font-bold text-white">₦{tournament.prize_pool?.toLocaleString() || '0'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Players</p>
                          <p className="font-bold text-white">
                            {tournament.current_players || 0}/{tournament.max_players}
                          </p>
                        </div>
                      </div>
                      
                      <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${((tournament.current_players || 0) / tournament.max_players) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-600/50">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-4">No live tournaments</p>
                  <button
                    onClick={handleJoinTournament}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all w-full"
                  >
                    Join Tournament
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/tournaments/create')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-lg hover:from-blue-800/30 hover:to-blue-700/30 transition-all group border border-blue-700/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Create Tournament</p>
                      <p className="text-sm text-gray-400">Host your own competition</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </button>

                <button
                  onClick={() => navigate('/matches/create')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-900/20 to-green-800/20 rounded-lg hover:from-green-800/30 hover:to-green-700/30 transition-all group border border-green-700/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                      <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Quick Match</p>
                      <p className="text-sm text-gray-400">Find instant 1v1 matches</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                </button>

                <button
                  onClick={() => navigate('/leaderboard')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/20 to-purple-800/20 rounded-lg hover:from-purple-800/30 hover:to-purple-700/30 transition-all group border border-purple-700/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">View Leaderboard</p>
                      <p className="text-sm text-gray-400">See top players rankings</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                </button>

                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-lg hover:from-yellow-800/30 hover:to-amber-800/30 transition-all group border border-yellow-700/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">My Profile</p>
                      <p className="text-sm text-gray-400">View stats & achievements</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                </button>
              </div>
            </div>

            {/* XP Points */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 text-white border border-indigo-700/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">XP Points</h3>
                  <p className="text-indigo-300/70">Earn XP by playing matches</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Coins className="w-6 h-6 text-yellow-300" />
                </div>
              </div>
              <div className="text-center mb-6">
                <p className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
                  {stats.xp_points?.toLocaleString() || '0'}
                </p>
                <p className="text-indigo-300/70">Total XP Earned</p>
              </div>
              <button
                onClick={() => navigate('/wallet')}
                className="w-full bg-gradient-to-r from-white/10 to-white/5 text-white py-3 rounded-lg font-bold hover:from-white/20 hover:to-white/10 transition-all border border-white/10"
              >
                View Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;