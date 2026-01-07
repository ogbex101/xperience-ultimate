// frontend/src/pages/Leaderboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leaderboardAPI } from '../utils/api';
import { 
  Trophy, Crown, Users, User, Filter, Gamepad2, 
  Target, Shield, Flame, Infinity, Eye, 
  BarChart3, TrendingUp, Award, Star,
  ArrowLeft, ArrowRight, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboardType, setLeaderboardType] = useState('players'); // 'players' or 'squads'
  const [selectedGame, setSelectedGame] = useState('all');
  const [availableGames, setAvailableGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);
  const [liveTournaments, setLiveTournaments] = useState([]);
  const [survivalChampions, setSurvivalChampions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 50
  });

  // Fetch available games
  useEffect(() => {
    fetchAvailableGames();
  }, []);

  // Fetch leaderboard data when filters change
  useEffect(() => {
    fetchLeaderboardData();
    fetchAdditionalData();
    fetchUserPosition();
  }, [leaderboardType, selectedGame, pagination.current_page]);

  const fetchAvailableGames = async () => {
    try {
      const response = await leaderboardAPI.getGames();
      if (response.success) {
        setAvailableGames(response.games || []);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  };

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      if (leaderboardType === 'players') {
        const response = await leaderboardAPI.getPlayers({
          game: selectedGame,
          page: pagination.current_page,
          limit: pagination.items_per_page
        });
        
        if (response.success) {
          setPlayers(response.players || []);
          setPagination(response.pagination || pagination);
        }
      } else {
        const response = await leaderboardAPI.getSquads({
          game: selectedGame,
          page: pagination.current_page,
          limit: pagination.items_per_page
        });
        
        if (response.success) {
          setSquads(response.squads || []);
          setPagination(response.pagination || pagination);
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalData = async () => {
    try {
      // Fetch recent winners
      const winnersResponse = await leaderboardAPI.getRecentWinners({ limit: 5 });
      if (winnersResponse.success) {
        setRecentWinners(winnersResponse.winners || []);
      }

      // Fetch live tournaments
      const liveResponse = await leaderboardAPI.getLiveTournaments();
      if (liveResponse.success) {
        setLiveTournaments(liveResponse.tournaments || []);
      }

      // Fetch survival champions
      const championsResponse = await leaderboardAPI.getSurvivalChampions();
      if (championsResponse.success && championsResponse.champions) {
        setSurvivalChampions(championsResponse.champions);
      }
    } catch (error) {
      console.error('Failed to fetch additional data:', error);
    }
  };

  const fetchUserPosition = async () => {
    if (!user) return;
    
    try {
      const response = await leaderboardAPI.getUserPosition({
        user_id: user.id,
        game: selectedGame,
        type: leaderboardType
      });
      
      if (response.success) {
        setUserPosition(response);
      }
    } catch (error) {
      console.error('Failed to fetch user position:', error);
    }
  };

  const getRankColor = (rank) => {
    const colors = {
      'E': '#999999',
      'D': '#4CAF50',
      'C': '#2196F3',
      'B': '#FF9800',
      'A': '#FF5722',
      'S': '#E91E63',
      'SS': '#9C27B0',
      'SSS': '#FFD700'
    };
    return colors[rank] || '#999999';
  };

  const getTrophyIcon = (position) => {
    if (position === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (position === 2) return <Trophy className="w-5 h-5 text-gray-300" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-700" />;
    return <span className="font-bold text-gray-300">#{position}</span>;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  const getTournamentTypeName = (type) => {
    const types = {
      '1v1': '1 vs 1',
      'survival': 'Survival of the Fittest',
      'freeforall': 'Free for All',
      'squad': 'Squad Tournament'
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Bar - Similar to PHP version */}
      <nav className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <div className="flex items-center">
              <img src="/logo.jpeg" alt="Xperience Logo" className="w-8 h-8 mr-2" />
              <h2 className="text-xl font-bold">Xperience</h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="nav-link">
              <User className="w-4 h-4 mr-1" /> Dashboard
            </button>
            <button onClick={() => navigate('/tournaments')} className="nav-link">
              <Trophy className="w-4 h-4 mr-1" /> Tournaments
            </button>
            <button className="nav-link active">
              <BarChart3 className="w-4 h-4 mr-1" /> Leaderboard
            </button>
            <button onClick={() => navigate('/profile')} className="nav-link">
              <User className="w-4 h-4 mr-1" /> Profile
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                <Trophy className="inline-block w-8 h-8 mr-2 text-yellow-400" />
                {leaderboardType === 'squads' ? (
                  selectedGame === 'all' ? 'Top Squads Leaderboard' : `Top ${selectedGame} Squads`
                ) : (
                  selectedGame === 'all' ? 'Global Player Leaderboard' : `Top ${selectedGame} Players`
                )}
              </h1>
              <p className="text-gray-400">
                {leaderboardType === 'squads' 
                  ? 'Compete with the best squads and climb to the top based on tournament victories!'
                  : 'Compete with players worldwide and climb to the top of the rankings!'}
              </p>
            </div>
            
            {userPosition && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 min-w-[200px]">
                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-1">Your Position</div>
                  <div className="text-2xl font-bold mb-1">
                    #{userPosition.position || 'N/A'}
                  </div>
                  {userPosition.percentile && (
                    <div className="text-sm text-green-400">
                      Top {userPosition.percentile}% of {userPosition.total}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Survival Champions Section */}
        {survivalChampions && (
          <div className="mb-8 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center mb-4">
              <Crown className="w-6 h-6 text-purple-400 mr-2" />
              <h2 className="text-xl font-bold">
                Survival of the Fittest Champions
              </h2>
              <span className="ml-auto text-sm text-gray-400">
                {survivalChampions.completed_at_formatted}
              </span>
            </div>
            
            <p className="text-gray-300 mb-6">
              Elite players who conquered "{survivalChampions.tournament_name}"
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {survivalChampions.champions.chaos && (
                <div className="bg-gradient-to-br from-red-900/20 to-red-900/10 rounded-lg p-4 border border-red-500/30">
                  <div className="flex items-center mb-3">
                    <Flame className="w-5 h-5 text-red-400 mr-2" />
                    <span className="font-semibold text-red-300">Chaos Champion</span>
                  </div>
                  <div className="flex items-center">
                    <img 
                      src={survivalChampions.champions.chaos.avatar || '/default-avatar.png'} 
                      alt={survivalChampions.champions.chaos.username}
                      className="w-12 h-12 rounded-full border-2 border-red-500 mr-3"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTI0IDI5QzI3LjMxMzcgMjkgMzAgMjYuMzEzNyAzMCAyM0MzMCAxOS42ODYzIDI3LjMxMzcgMTcgMjQgMTdDMjAuNjg2MyAxNyAxOCAxOS42ODYzIDE4IDIzQzE4IDI2LjMxMzcgMjAuNjg2MyAyOSAyNCAyOVoiIGZpbGw9IiM2NjYiLz4KPHBhdGggZD0iTTI2IDI2QzI2IDI5LjMxMzcgMjMuMzEzNyAzMiAyMCAzMkgxMkM4LjY4NjMgMzIgNiAyOS4zMTM3IDYgMjZDMjEgMjYgMjEgMjYgMjYgMjZaIiBmaWxsPSIjNjY2Ii8+Cjwvc3ZnPgo=';
                      }}
                    />
                    <div>
                      <h4 className="font-bold">
                        {survivalChampions.champions.chaos.username}
                      </h4>
                      <div className="flex items-center mt-1">
                        <span className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-300">
                          {survivalChampions.champions.chaos.rank} Rank
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {survivalChampions.champions.chaos.requirement}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {survivalChampions.champions.order && (
                <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/10 rounded-lg p-4 border border-blue-500/30">
                  <div className="flex items-center mb-3">
                    <Shield className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="font-semibold text-blue-300">Order Champion</span>
                  </div>
                  <div className="flex items-center">
                    <img 
                      src={survivalChampions.champions.order.avatar || '/default-avatar.png'} 
                      alt={survivalChampions.champions.order.username}
                      className="w-12 h-12 rounded-full border-2 border-blue-500 mr-3"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTI0IDI5QzI3LjMxMzcgMjkgMzAgMjYuMzEzNyAzMCAyM0MzMCAxOS42ODYzIDI3LjMxMzcgMTcgMjQgMTdDMjAuNjg2MyAxNyAxOCAxOS42ODYzIDE4IDIzQzE4IDI2LjMxMzcgMjAuNjg2MyAyOSAyNCAyOVoiIGZpbGw9IiM2NjYiLz4KPHBhdGggZD0iTTI2IDI2QzI2IDI5LjMxMzcgMjMuMzEzNyAzMiAyMCAzMkgxMkM4LjY4NjMgMzIgNiAyOS4zMTM3IDYgMjZDMjEgMjYgMjEgMjYgMjYgMjZaIiBmaWxsPSIjNjY2Ii8+Cjwvc3ZnPgo=';
                      }}
                    />
                    <div>
                      <h4 className="font-bold">
                        {survivalChampions.champions.order.username}
                      </h4>
                      <div className="flex items-center mt-1">
                        <span className="text-xs px-2 py-1 rounded bg-blue-900/50 text-blue-300">
                          {survivalChampions.champions.order.rank} Rank
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {survivalChampions.champions.order.requirement}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {survivalChampions.champions.boundless && (
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/10 rounded-lg p-4 border border-purple-500/30">
                  <div className="flex items-center mb-3">
                    <Infinity className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="font-semibold text-purple-300">Boundless Champion</span>
                  </div>
                  <div className="flex items-center">
                    <img 
                      src={survivalChampions.champions.boundless.avatar || '/default-avatar.png'} 
                      alt={survivalChampions.champions.boundless.username}
                      className="w-12 h-12 rounded-full border-2 border-purple-500 mr-3"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTI0IDI5QzI3LjMxMzcgMjkgMzAgMjYuMzEzNyAzMCAyM0MzMCAxOS42ODYzIDI3LjMxMzcgMTcgMjQgMTdDMjAuNjg2MyAxNyAxOCAxOS42ODYzIDE4IDIzQzE4IDI2LjMxMzcgMjAuNjg2MyAyOSAyNCAyOVoiIGZpbGw9IiM2NjYiLz4KPHBhdGggZD0iTTI2IDI2QzI2IDI5LjMxMzcgMjMuMzEzNyAzMiAyMCAzMkgxMkM4LjY4NjMgMzIgNiAyOS4zMTM3IDYgMjZDMjEgMjYgMjEgMjYgMjYgMjZaIiBmaWxsPSIjNjY2Ii8+Cjwvc3ZnPgo=';
                      }}
                    />
                    <div>
                      <h4 className="font-bold">
                        {survivalChampions.champions.boundless.username}
                      </h4>
                      <div className="flex items-center mt-1">
                        <span className="text-xs px-2 py-1 rounded bg-purple-900/50 text-purple-300">
                          {survivalChampions.champions.boundless.rank} Rank
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {survivalChampions.champions.boundless.requirement}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <p><Crown className="inline-block w-4 h-4 mr-1" /> Concluded: {survivalChampions.completed_at_formatted}</p>
            </div>
          </div>
        )}

        {/* Leaderboard Type Filter */}
        <div className="mb-6 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Leaderboard Type
          </h3>
          <div className="flex space-x-4">
            <button
              onClick={() => setLeaderboardType('players')}
              className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                leaderboardType === 'players'
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Individual Players
            </button>
            <button
              onClick={() => setLeaderboardType('squads')}
              className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                leaderboardType === 'squads'
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Squads & Groups
            </button>
          </div>
        </div>

        {/* Game Filter */}
        <div className="mb-8 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Gamepad2 className="w-5 h-5 mr-2" />
            Filter by Game
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedGame('all')}
              className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                selectedGame === 'all'
                  ? 'bg-purple-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">🌐</span>
              All Games
            </button>
            
            {availableGames.map((game) => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                  selectedGame === game
                    ? 'bg-purple-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span className="mr-2">🎮</span>
                {game}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden mb-8">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-400">Loading leaderboard...</p>
            </div>
          ) : leaderboardType === 'players' ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Rank</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Player</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Rank</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Wins</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Matches</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Win Rate</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Tournaments</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, index) => {
                      const rankNumber = pagination.current_page === 1 
                        ? index + 1 
                        : (pagination.current_page - 1) * pagination.items_per_page + index + 1;
                      const isCurrentUser = user && player.id === user.id;
                      
                      return (
                        <tr 
                          key={player.id}
                          className={`border-t border-gray-700/50 hover:bg-gray-800/50 transition-colors ${
                            isCurrentUser ? 'bg-blue-900/20' : ''
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center w-8 h-8">
                              {getTrophyIcon(rankNumber)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <img 
                                src={player.profile_pic || '/default-avatar.png'} 
                                alt={player.username}
                                className="w-10 h-10 rounded-full border-2 mr-3"
                                style={{ borderColor: getRankColor(player.rank) }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTIwIDI1QzIzLjMxMzcgMjUgMjYgMjIuMzEzNyAyNiAxOUMyNiAxNS42ODYzIDIzLjMxMzcgMTMgMjAgMTNDMTYuNjg2MyAxMyAxNCAxNS42ODYzIDE0IDE5QzE0IDIyLjMxMzcgMTYuNjg2MyAyNSAyMCAyNVoiIGZpbGw9IiM2NjYiLz4KPHBhdGggZD0iTTMwIDMxQzMwIDM0LjMxMzcgMjcuMzEzNyAzNyAyNCAzN0gxNkMxMi42ODYzIDM3IDEwIDM0LjMxMzcgMTAgMzFDMjUgMzEgMjUgMzEgMzAgMzFaIiBmaWxsPSIjNjY2Ii8+Cjwvc3ZnPgo=';
                                }}
                              />
                              <div>
                                <div className="font-semibold flex items-center">
                                  {player.username}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs px-2 py-1 bg-blue-600 rounded">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {player.rank_info?.name || player.rank}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: `${getRankColor(player.rank)}20`,
                                color: getRankColor(player.rank)
                              }}
                            >
                              {player.rank}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold">
                              {player.wins || player.game_wins || 0}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-300">
                            {player.matches_played || player.game_matches_played || 0}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <BarChart3 className="w-4 h-4 mr-2 text-green-400" />
                              <span className="font-semibold text-green-400">
                                {(player.win_rate || player.game_win_rate || 0).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
                              <span className="font-semibold">
                                {player.tournaments_won || player.game_tournaments_won || 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-purple-400 font-semibold">
                              {player.xp_points?.toLocaleString() || 0}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {players.length === 0 && (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-xl mb-2">
                    {selectedGame === 'all' ? 'No Players Found' : `No Players Found for ${selectedGame}`}
                  </h3>
                  <p className="text-gray-400">
                    {selectedGame === 'all' 
                      ? 'There are no players with match history yet.'
                      : `No players have played ${selectedGame} matches yet.`}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Rank</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Squad</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Members</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Specialty</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Tournaments Won</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Total Prize</th>
                      <th className="py-4 px-6 text-left text-gray-400 font-semibold">Leader</th>
                    </tr>
                  </thead>
                  <tbody>
                    {squads.map((squad, index) => {
                      const rankNumber = pagination.current_page === 1 
                        ? index + 1 
                        : (pagination.current_page - 1) * pagination.items_per_page + index + 1;
                      const isCurrentUserSquad = user && squad.creator_id === user.id;
                      
                      return (
                        <tr 
                          key={squad.id}
                          className={`border-t border-gray-700/50 hover:bg-gray-800/50 transition-colors ${
                            isCurrentUserSquad ? 'bg-green-900/20' : ''
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center w-8 h-8">
                              {getTrophyIcon(rankNumber)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold mr-3">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-semibold flex items-center">
                                  {squad.squad_name}
                                  {isCurrentUserSquad && (
                                    <span className="ml-2 text-xs px-2 py-1 bg-green-600 rounded">
                                      Your Squad
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-400 truncate max-w-xs">
                                  {squad.description || 'No description'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-blue-400" />
                              <span className="font-semibold">
                                {squad.member_count || 0}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">
                                ({squad.admin_count || 0} admins)
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <Gamepad2 className="w-4 h-4 mr-2 text-green-400" />
                              <span className="font-semibold text-green-400">
                                {squad.game_specialty}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
                              <span className="font-semibold">
                                {squad.tournaments_won || 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-green-400">
                              {squad.total_prize_won?.toLocaleString() || 0} XP
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <img 
                                src={squad.creator_avatar || '/default-avatar.png'} 
                                alt={squad.creator_name}
                                className="w-8 h-8 rounded-full mr-2"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTE2IDIwQzE5LjMxMzcgMjAgMjIgMTcuMzEzNyAyMiAxNEMyMiAxMC42ODYzIDE5LjMxMzcgOCAxNiA4QzEyLjY4NjMgOCAxMCAxMC42ODYzIDEwIDE0QzEwIDE3LjMxMzcgMTIuNjg2MyAyMCAxNiAyMFoiIGZpbGw9IiM2NjYiLz4KPHBhdGggZD0iTTI2IDI2QzI2IDI5LjMxMzcgMjMuMzEzNyAzMiAyMCAzMkgxMkM4LjY4NjMgMzIgNiAyOS4zMTM3IDYgMjZDMjEgMjYgMjEgMjYgMjYgMjZaIiBmaWxsPSIjNjY2Ii8+Cjwvc3ZnPgo=';
                                }}
                              />
                              <span>{squad.creator_name}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {squads.length === 0 && (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-xl mb-2">
                    {selectedGame === 'all' ? 'No Squads Found' : `No Squads Found for ${selectedGame}`}
                  </h3>
                  <p className="text-gray-400">
                    {selectedGame === 'all' 
                      ? 'There are no squads with tournament wins yet.'
                      : `No squads have won ${selectedGame} tournaments yet.`}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="border-t border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-400">
                  Showing page {pagination.current_page} of {pagination.total_pages}
                  <span className="mx-2">•</span>
                  {pagination.total_items} total {leaderboardType}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.total_pages}
                    className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 flex items-center"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Tournaments & Recent Winners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Live Tournaments */}
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <Eye className="w-6 h-6 text-red-400 mr-2" />
              <h3 className="text-xl font-bold">Live Tournaments</h3>
              <span className="ml-auto flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-red-400">{liveTournaments.length} LIVE</span>
              </span>
            </div>
            
            {liveTournaments.length > 0 ? (
              <div className="space-y-4">
                {liveTournaments.slice(0, 3).map((tournament) => (
                  <div key={tournament.id} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{tournament.name}</h4>
                        <p className="text-sm text-gray-400">{tournament.game}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-900/50 text-red-300 rounded">
                        {tournament.platform}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-300">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {tournament.current_players}/{tournament.max_players}
                        </div>
                        <div className="flex items-center mt-1">
                          <Trophy className="w-3 h-3 mr-1 text-yellow-400" />
                          {tournament.prize_pool_formatted} XP
                        </div>
                      </div>
                      <a 
                        href={tournament.live_stream_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Watch
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No live tournaments at the moment</p>
              </div>
            )}
            
            {liveTournaments.length > 3 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-blue-400 hover:text-blue-300">
                  View all {liveTournaments.length} live tournaments →
                </button>
              </div>
            )}
          </div>

          {/* Recent Winners */}
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <Crown className="w-6 h-6 text-yellow-400 mr-2" />
              <h3 className="text-xl font-bold">Recent Champions</h3>
            </div>
            
            {recentWinners.length > 0 ? (
              <div className="space-y-4">
                {recentWinners.slice(0, 3).map((winner) => (
                  <div key={winner.tournament_id} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center mr-3">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{winner.winner_name}</h4>
                        <p className="text-sm text-gray-400">{winner.tournament_name}</p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded mr-2">
                            {winner.game}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-900/50 text-green-300 rounded">
                            {getTournamentTypeName(winner.tournament_type)}
                          </span>
                          <span className="ml-auto text-xs text-yellow-400 font-semibold">
                            {winner.prize_pool_formatted} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Crown className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No recent tournament winners</p>
              </div>
            )}
            
            {recentWinners.length > 3 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-blue-400 hover:text-blue-300">
                  View all {recentWinners.length} recent winners →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-6">Leaderboard Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-400 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{pagination.total_items}</div>
                  <div className="text-sm text-gray-400">
                    Total {leaderboardType === 'players' ? 'Ranked Players' : 'Ranked Squads'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center">
                <Trophy className="w-8 h-8 text-yellow-400 mr-3" />
                <div>
                  <div className="text-2xl font-bold">
                    {leaderboardType === 'players' 
                      ? players.reduce((sum, p) => sum + (p.tournaments_won || 0), 0)
                      : squads.reduce((sum, s) => sum + (s.tournaments_won || 0), 0)
                    }
                  </div>
                  <div className="text-sm text-gray-400">Tournaments Won</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-purple-400 mr-3" />
                <div>
                  <div className="text-2xl font-bold">
                    {selectedGame === 'all' ? 'All Games' : selectedGame}
                  </div>
                  <div className="text-sm text-gray-400">
                    {availableGames.length} Games Available
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nav-link {
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.3s;
          display: flex;
          align-items: center;
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .nav-link.active {
          background-color: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;