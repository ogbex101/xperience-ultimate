// components/AddFriendModal.jsx - UPDATED FOR YOUR DATABASE
import React, { useState, useEffect } from 'react';
import { 
  Search, X, UserPlus, Trophy, Filter, Clock,
  Users, Gamepad2, UserCheck, ShieldAlert, Zap,
  Award, Target, ChevronRight, Star, Loader,
  Crown, Sword, Shield, Sparkles, TrendingUp
} from 'lucide-react';
import friendsAPI from '../utils/friendsAPI';
import { useAuth } from '../contexts/AuthContext';

const AddFriendModal = ({ onClose, onFriendAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequests, setSendingRequests] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [selectedRank, setSelectedRank] = useState('all');
  const [selectedSort, setSelectedSort] = useState('win_rate');
  
  const { user: currentUser } = useAuth();

  // Rank order for sorting (E is lowest, SSS is highest)
  const rankOrder = {
    'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5, 'SS': 6, 'SSS': 7
  };

  // Rank colors based on your system
  const getRankColor = (rank) => {
    if (!rank) return 'bg-gray-700 text-gray-300';
    
    const rankMap = {
      'E': 'bg-gray-600 text-gray-100',
      'D': 'bg-blue-600 text-white',
      'C': 'bg-green-600 text-white',
      'B': 'bg-yellow-600 text-white',
      'A': 'bg-orange-600 text-white',
      'S': 'bg-red-600 text-white',
      'SS': 'bg-purple-600 text-white',
      'SSS': 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
    };
    
    return rankMap[rank] || 'bg-gray-700 text-gray-300';
  };

  // Rank icons
  const getRankIcon = (rank) => {
    const rankIcons = {
      'E': <Trophy className="w-4 h-4" />,
      'D': <Trophy className="w-4 h-4 text-blue-400" />,
      'C': <Trophy className="w-4 h-4 text-green-400" />,
      'B': <Award className="w-4 h-4 text-yellow-400" />,
      'A': <Award className="w-4 h-4 text-orange-400" />,
      'S': <Crown className="w-4 h-4 text-red-400" />,
      'SS': <Crown className="w-4 h-4 text-purple-400" />,
      'SSS': <Sparkles className="w-4 h-4 text-yellow-300" />
    };
    return rankIcons[rank] || <Trophy className="w-4 h-4 text-gray-400" />;
  };

  // Fetch suggested players (players with similar rank or high win rate)
  useEffect(() => {
    if (activeTab === 'suggested') {
      fetchSuggestedPlayers();
    }
  }, [activeTab]);

  const fetchSuggestedPlayers = async () => {
    setLoadingSuggested(true);
    try {
      // Use search with empty query to get random players
      const response = await friendsAPI.searchUsers('');
      if (response.success && response.results) {
        // Filter out yourself and already friends, sort by win rate
        const filtered = response.results
          .filter(player => player.id !== currentUser?.id)
          .filter(player => player.friend_status !== 'accepted' && player.friend_status !== 'pending')
          .sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0))
          .slice(0, 8);
        
        setSuggestedPlayers(filtered);
      }
    } catch (error) {
      console.error('Error fetching suggested players:', error);
    } finally {
      setLoadingSuggested(false);
    }
  };

  // Search for users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await friendsAPI.searchUsers(searchQuery);
      
      if (response.success) {
        // Sort results based on selected criteria
        const sortedResults = sortResults(response.results || []);
        setSearchResults(sortedResults);
      } else {
        setError(response.message || 'Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Error connecting to server');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Sort results based on selected criteria
  const sortResults = (results) => {
    return results.sort((a, b) => {
      if (selectedSort === 'rank') {
        return (rankOrder[b.rank] || 0) - (rankOrder[a.rank] || 0);
      }
      if (selectedSort === 'win_rate') {
        return (b.win_rate || 0) - (a.win_rate || 0);
      }
      if (selectedSort === 'matches') {
        return (b.matches_played || 0) - (a.matches_played || 0);
      }
      return a.username?.localeCompare(b.username || '');
    });
  };

 // In AddFriendModal.jsx, update the handleSendRequest function:
const handleSendRequest = async (userId, username) => {
  if (sendingRequests[userId]) return;
  
  setSendingRequests(prev => ({ ...prev, [userId]: true }));
  setError(null);
  
  try {
    const response = await friendsAPI.sendRequest(userId);
    
    if (response.success) {
      // Update UI
      setSearchResults(prev => prev.map(user => 
        user.id === userId ? { ...user, friend_status: 'pending' } : user
      ));
      
      setSuggestedPlayers(prev => prev.map(user => 
        user.id === userId ? { ...user, friend_status: 'pending' } : user
      ));
      
      // Call the callback if provided
      if (onFriendRequestSent) {
        onFriendRequestSent(username);
      }
      
      if (onFriendAdded) {
        onFriendAdded();
      }
    } else {
      setError(response.message || 'Failed to send friend request');
    }
  } catch (error) {
    console.error('Error sending friend request:', error);
    setError(error.response?.data?.message || 'Failed to send friend request');
  } finally {
    setSendingRequests(prev => ({ ...prev, [userId]: false }));
  }
};

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedSort]);

  // Filter results by rank
  const filteredResults = selectedRank === 'all' 
    ? searchResults 
    : searchResults.filter(user => user.rank === selectedRank);

  // Get profile picture URL
  const getProfilePic = (profilePic) => {
    if (profilePic && profilePic !== 'default.png') {
      return `/uploads/${profilePic}`;
    }
    return '/default-avatar.png';
  };

  // Calculate player level based on matches played
  const getPlayerLevel = (matchesPlayed) => {
    if (!matchesPlayed) return 1;
    return Math.min(100, Math.floor(matchesPlayed / 10) + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 pb-4 bg-gradient-to-b from-gray-900 to-transparent border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Add Gaming Friends</h2>
              <p className="text-gray-400">Connect with players, form teams, and compete together</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { id: 'search', label: 'Search Players', icon: Search },
              { id: 'suggested', label: 'Suggested', icon: Users },
              { id: 'rankings', label: 'Top Rankings', icon: Trophy }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Bar (only for search tab) */}
          {activeTab === 'search' && (
            <div className="relative mb-6">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username (e.g., 'lenovo', 'destroyer')..."
                className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          )}

          {/* Filters/Sort Options */}
          <div className="flex flex-wrap gap-3 mb-4">
            {activeTab === 'search' && (
              <>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Rank:</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedRank('all')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedRank === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    All Ranks
                  </button>
                  
                  {['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'].map((rank) => (
                    <button
                      key={rank}
                      onClick={() => setSelectedRank(rank)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedRank === rank
                          ? getRankColor(rank) + ' font-bold'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {rank}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-gray-400">Sort by:</span>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="win_rate">Win Rate</option>
                    <option value="rank">Rank</option>
                    <option value="matches">Matches Played</option>
                    <option value="username">Username</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {activeTab === 'search' && (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
                  <p className="mt-4 text-gray-400">Searching for players...</p>
                </div>
              ) : searchQuery ? (
                filteredResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredResults.map((player) => {
                      const isAlreadyFriend = player.friend_status === 'accepted';
                      const isRequestPending = player.friend_status === 'pending';
                      const isBlocked = player.friend_status === 'blocked';
                      
                      return (
                        <div
                          key={player.id}
                          className="group bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/30 transition-all hover:scale-[1.02]"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
                                  <img 
                                    src={getProfilePic(player.profile_pic)}
                                    alt={player.username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/default-avatar.png';
                                    }}
                                  />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-900 flex items-center justify-center ${getRankColor(player.rank).split(' ')[0]}`}>
                                  <span className="text-xs font-bold">
                                    {player.rank || 'E'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                                    {player.username}
                                  </h3>
                                  {player.is_admin && (
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={`px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1 ${getRankColor(player.rank)}`}>
                                    {getRankIcon(player.rank)}
                                    <span>{player.rank || 'E'}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                    <span className="text-xs text-gray-400">
                                      Level {getPlayerLevel(player.matches_played)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-2">
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="text-green-400 font-medium">
                                      {player.win_rate || 0}% WR
                                    </span>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-gray-400">
                                      {player.wins || 0}W - {player.losses || 0}L
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            <div>
                              {isAlreadyFriend ? (
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                  <UserCheck className="w-4 h-4" />
                                  <span className="hidden sm:inline">Friends</span>
                                </div>
                              ) : isRequestPending ? (
                                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                  <Clock className="w-4 h-4" />
                                  <span className="hidden sm:inline">Pending</span>
                                </div>
                              ) : isBlocked ? (
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                  <ShieldAlert className="w-4 h-4" />
                                  <span className="hidden sm:inline">Blocked</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSendRequest(player.id, player.username)}
                                  disabled={sendingRequests[player.id]}
                                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {sendingRequests[player.id] ? (
                                    <>
                                      <Loader className="w-4 h-4 animate-spin" />
                                      <span className="hidden sm:inline">Sending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="w-4 h-4" />
                                      <span className="hidden sm:inline">Add</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Additional Stats */}
                          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-gray-800/50 rounded-lg">
                              <div className="text-lg font-bold text-white">{player.matches_played || 0}</div>
                              <div className="text-xs text-gray-400">Matches</div>
                            </div>
                            <div className="p-2 bg-gray-800/50 rounded-lg">
                              <div className="text-lg font-bold text-white">{player.wins || 0}</div>
                              <div className="text-xs text-gray-400">Wins</div>
                            </div>
                            <div className="p-2 bg-gray-800/50 rounded-lg">
                              <div className="text-lg font-bold text-yellow-400">{player.balance || 0}</div>
                              <div className="text-xs text-gray-400">XP Balance</div>
                            </div>
                          </div>
                          
                          {/* Player Status */}
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${player.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                              <span className={player.status === 'online' ? 'text-green-400' : 'text-gray-400'}>
                                {player.status === 'online' ? 'Online Now' : 'Last seen recently'}
                              </span>
                            </div>
                            <span className="text-gray-500">
                              Joined {new Date(player.created_at).getFullYear()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-800 flex items-center justify-center">
                      <Search className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No players found</h3>
                    <p className="text-gray-400 mb-6">
                      No players match "{searchQuery}". Try searching for:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['lenovo', 'destroyer', 'mystic', 'flawless', 'kratos'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setSearchQuery(suggestion)}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                    <Search className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Search for Players</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Enter a username to find players and add them as friends. You can filter by rank and sort by win rate.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="text-sm font-medium text-white mb-1">Search by Rank</p>
                      <p className="text-xs text-gray-400">Find players by their rank (E to SSS)</p>
                    </div>
                    
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                      </div>
                      <p className="text-sm font-medium text-white mb-1">Filter by Win Rate</p>
                      <p className="text-xs text-gray-400">Find highly skilled players</p>
                    </div>
                    
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Sword className="w-5 h-5 text-green-400" />
                      </div>
                      <p className="text-sm font-medium text-white mb-1">Active Players</p>
                      <p className="text-xs text-gray-400">Find players with many matches</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'suggested' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Suggested Players</h3>
                <p className="text-gray-400">Players you might want to connect with based on activity</p>
              </div>
              
              {loadingSuggested ? (
                <div className="text-center py-12">
                  <Loader className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                  <p className="mt-4 text-gray-400">Loading suggestions...</p>
                </div>
              ) : suggestedPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedPlayers.map((player) => (
                    <div key={player.id} className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl overflow-hidden">
                            <img 
                              src={getProfilePic(player.profile_pic)}
                              alt={player.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${getRankColor(player.rank).split(' ')[0]}`}>
                            <span className="text-[8px] font-bold block text-center leading-4">
                              {player.rank || 'E'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{player.username}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${getRankColor(player.rank)}`}>
                              {player.rank || 'E'}
                            </span>
                            <span className="text-xs text-green-400 font-medium">
                              {player.win_rate || 0}% WR
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span>{player.matches_played || 0} matches</span>
                        <span>{player.wins || 0}W - {player.losses || 0}L</span>
                      </div>
                      
                      <button
                        onClick={() => handleSendRequest(player.id, player.username)}
                        disabled={sendingRequests[player.id] || player.friend_status === 'pending'}
                        className={`w-full py-2 rounded-lg font-medium transition-all ${
                          player.friend_status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105'
                        }`}
                      >
                        {player.friend_status === 'pending' ? (
                          <span className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            Request Sent
                          </span>
                        ) : sendingRequests[player.id] ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader className="w-4 h-4 animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add Friend
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-800 flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-600" />
                  </div>
                  <p className="text-gray-400">No suggested players at the moment</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rankings' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Top Players by Rank</h3>
                <p className="text-gray-400">Find the highest ranked players to challenge or team up with</p>
              </div>
              
              <div className="space-y-3">
                {['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E'].map((rank) => (
                  <div key={rank} className="bg-gray-800/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRankColor(rank)}`}>
                          {getRankIcon(rank)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Rank {rank} Players</h4>
                          <p className="text-sm text-gray-400">Find {rank} ranked competitors</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('search');
                          setSelectedRank(rank);
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                      >
                        View All
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      {rank === 'SSS' && 'Elite players - The best of the best'}
                      {rank === 'SS' && 'Master players - Exceptional skill level'}
                      {rank === 'S' && 'Expert players - Highly skilled competitors'}
                      {rank === 'A' && 'Advanced players - Strong competitive skills'}
                      {rank === 'B' && 'Intermediate players - Solid gaming foundation'}
                      {rank === 'C' && 'Developing players - Improving their skills'}
                      {rank === 'D' && 'Beginner players - Learning the ropes'}
                      {rank === 'E' && 'New players - Just starting their journey'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 pt-4 bg-gradient-to-t from-gray-900 to-transparent border-t border-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {activeTab === 'search' && searchQuery && (
                <span>Found {filteredResults.length} player{filteredResults.length !== 1 ? 's' : ''}</span>
              )}
              {activeTab === 'suggested' && (
                <span>{suggestedPlayers.length} suggested players</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-all"
              >
                Close
              </button>
              {activeTab === 'search' && (
                <button
                  onClick={handleSearch}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-medium transition-all"
                >
                  Search Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;