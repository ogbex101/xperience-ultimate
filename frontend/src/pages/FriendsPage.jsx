// FriendsPage.jsx - UPDATED WITH BETTER FEEDBACK
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, UserPlus, Clock, Shield, MessageSquare, 
  Trophy, Swords, Crown, Star, Heart, ChevronRight,
  Wifi, WifiOff, MoreVertical, X, Check, UserX,
  Filter, RefreshCw, Calendar, Award, Target,
  Gamepad2, Sword, Zap, Shield as ShieldIcon,
  CheckCircle, XCircle, AlertCircle, Bell, Send
} from 'lucide-react';
import FriendRequests from '../components/FriendRequests';
import AddFriendModal from '../components/AddFriendModal';
import friendsAPI from '../utils/friendsAPI';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './FriendsPage.css';

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    pending: 0,
    topRanked: 0,
    gamingNow: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const { socket, isConnected, onlineUsers, isUserOnline } = useSocket();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Show toast message
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      
      const [friendsRes, requestsRes] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getRequests()
      ]);

      const fetchedFriends = friendsRes.friends || [];
      setFriends(fetchedFriends);
      setRequests(requestsRes.requests || []);
      
      // Determine online friends
      const onlineFriendsList = fetchedFriends.filter(friend => 
        isUserOnline(friend.id) || friend.status === 'online'
      );
      
      setOnlineFriends(onlineFriendsList);
      
      // Calculate stats
      const topRankedCount = fetchedFriends.filter(f => 
        f.rank && ['S', 'SS', 'SSS'].includes(f.rank)
      ).length;
      
      setStats({
        total: fetchedFriends.length,
        online: onlineFriendsList.length,
        pending: requestsRes.requests?.length || 0,
        topRanked: topRankedCount,
        gamingNow: 0 // You can update this with actual gaming status
      });
      
      console.log('✅ Friends data loaded:', {
        total: fetchedFriends.length,
        online: onlineFriendsList.length,
        pending: requestsRes.requests?.length || 0
      });
      
    } catch (error) {
      console.error('Error fetching friends data:', error);
      showToast('Failed to load friends data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async (friendId, isCurrentlyFavorite) => {
    try {
      await friendsAPI.addFavorite(friendId, !isCurrentlyFavorite);
      
      // Update local state
      setFriends(prev => prev.map(friend =>
        friend.id === friendId ? { 
          ...friend, 
          is_favorite: !isCurrentlyFavorite ? 1 : 0 
        } : friend
      ));
      
      setOnlineFriends(prev => prev.map(friend =>
        friend.id === friendId ? { 
          ...friend, 
          is_favorite: !isCurrentlyFavorite ? 1 : 0 
        } : friend
      ));
      
      showToast(
        !isCurrentlyFavorite ? 'Added to favorites!' : 'Removed from favorites!',
        'success'
      );
      
    } catch (error) {
      console.error('Error updating favorite:', error);
      showToast('Failed to update favorite', 'error');
    }
  };

  const handleMessageFriend = (friendId, friendUsername) => {
    navigate(`/chat/${friendId}`);
    showToast(`Opening chat with ${friendUsername}`, 'info');
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (window.confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      try {
        await friendsAPI.removeFriend(friendId);
        await fetchFriendsData();
        showToast(`${friendName} removed from friends`, 'success');
      } catch (error) {
        console.error('Error removing friend:', error);
        showToast('Failed to remove friend', 'error');
      }
    }
  };

  const handleAcceptRequest = async (requestId, username) => {
  try {
    await friendsAPI.acceptRequest(requestId);
    await fetchFriendsData();
    showToast(`Accepted friend request from ${username}!`, 'success');
  } catch (error) {
    console.error('Error accepting request:', error);
    showToast('Failed to accept request', 'error');
  }
};

const handleRejectRequest = async (requestId, username) => {
  try {
    await friendsAPI.rejectRequest(requestId);
    await fetchFriendsData();
    showToast(`Declined request from ${username}`, 'info');
  } catch (error) {
    console.error('Error rejecting request:', error);
    showToast('Failed to decline request', 'error');
  }
};

  const handleFriendRequestSent = (username) => {
    showToast(`Friend request sent to ${username}!`, 'success');
  };

  useEffect(() => {
    fetchFriendsData();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      if (isConnected) {
        // Refresh online status periodically
        const onlineFriendsList = friends.filter(friend => 
          isUserOnline(friend.id)
        );
        setOnlineFriends(onlineFriendsList);
        setStats(prev => ({ ...prev, online: onlineFriendsList.length }));
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [isConnected]);

  // Filter friends based on search and filter
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         friend.rank?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'online') return matchesSearch && isUserOnline(friend.id);
    if (filter === 'favorites') return matchesSearch && friend.is_favorite;
    if (filter === 'top_ranked') return matchesSearch && ['S', 'SS', 'SSS'].includes(friend.rank);
    
    return matchesSearch;
  });

  // Get rank color
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

  // Get status text
  const getStatusText = (friend) => {
    if (isUserOnline(friend.id)) return 'Online';
    return 'Offline';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin absolute top-0 left-0"></div>
                <Gamepad2 className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="mt-6 text-gray-400 font-medium">Loading your gaming squad...</p>
              <p className="text-sm text-gray-500 mt-2">
                {isConnected ? 'Connected to chat' : 'Connecting...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black p-4 md:p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in ${toastMessage.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : toastMessage.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'}`}>
          {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toastMessage.type === 'error' && <XCircle className="w-5 h-5" />}
          {toastMessage.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toastMessage.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-900 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
                  {isConnected ? <Wifi className="w-2.5 h-2.5 text-white mx-auto mt-0.5" /> : <WifiOff className="w-2.5 h-2.5 text-white mx-auto mt-0.5" />}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {currentUser?.username}'s Squad
                </h1>
                <p className="text-gray-400">Connect, compete, and conquer together</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchFriendsData()}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              title="Refresh friends list"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAddFriend(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl flex items-center gap-2 font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Friend</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 hover:border-purple-500/30 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Friends</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${Math.min(100, (stats.total / 100) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 hover:border-green-500/30 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Online Now</p>
                <p className="text-3xl font-bold text-white">{stats.online}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <div className="relative">
                  <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse absolute top-0 left-0 opacity-75"></div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.online / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-400">{stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%</span>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 hover:border-yellow-500/30 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-white">{stats.pending}</p>
                {stats.pending > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Bell className="w-3 h-3 text-yellow-400 animate-pulse" />
                    <span className="text-xs text-yellow-400">New requests!</span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div className="mt-4">
              {stats.pending > 0 ? (
                <button
                  onClick={() => setActiveTab('pending')}
                  className="text-sm text-yellow-400 hover:text-yellow-300 font-medium flex items-center gap-1 animate-pulse"
                >
                  View requests <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <p className="text-sm text-gray-500">No pending requests</p>
              )}
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 hover:border-red-500/30 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Top Ranked</p>
                <p className="text-3xl font-bold text-white">{stats.topRanked}</p>
                <p className="text-xs text-gray-500 mt-1">S+ rank friends</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setFilter('top_ranked')}
                className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
              >
                View top players <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search friends by name or rank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
          </div>
          
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All Friends', icon: Users },
              { id: 'online', label: 'Online', icon: Wifi, showDot: true },
              { id: 'favorites', label: 'Favorites', icon: Star },
              { id: 'top_ranked', label: 'Top Ranked', icon: Crown }
            ].map((filterType) => (
              <button
                key={filterType.id}
                onClick={() => setFilter(filterType.id)}
                className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all relative ${
                  filter === filterType.id 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <filterType.icon className="w-4 h-4" />
                <span className="capitalize">{filterType.label}</span>
                {filterType.showDot && stats.online > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-700/50">
            <div className="flex overflow-x-auto">
              {[
                { id: 'all', label: 'All Friends', count: stats.total, icon: Users },
                { id: 'online', label: 'Online', count: stats.online, icon: Wifi },
                { id: 'pending', label: 'Requests', count: stats.pending, icon: Bell, highlight: stats.pending > 0 },
                { id: 'favorites', label: 'Favorites', count: friends.filter(f => f.is_favorite).length, icon: Star },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 border-b-2 font-medium whitespace-nowrap transition-all relative ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-white bg-gray-800/50'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id 
                        ? 'bg-purple-500 text-white' 
                        : tab.highlight ? 'bg-yellow-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === 'all' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFriends.length > 0 ? (
                  filteredFriends.map(friend => {
                    const isOnline = isUserOnline(friend.id);
                    
                    return (
                      <div 
                        key={friend.id} 
                        className="group bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10"
                      >
                        {/* Friend Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
                                {friend.profile_pic && friend.profile_pic !== 'default.png' ? (
                                  <img 
                                    src={`/uploads/${friend.profile_pic}`} 
                                    alt={friend.username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/default-avatar.png';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                                    <span className="text-white font-bold text-xl">
                                      {friend.username?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-900 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                            </div>
                            <div>
                              <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                                {friend.username}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getRankColor(friend.rank)}`}>
                                  {friend.rank || 'E'}
                                </span>
                                {friend.is_favorite && (
                                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMessageFriend(friend.id, friend.username)}
                              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Send message"
                            >
                              <MessageSquare className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Status */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                              {getStatusText(friend)}
                            </span>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-gray-300">{friend.win_rate || 0}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{friend.wins || 0}W</span>
                            <span>{friend.losses || 0}L</span>
                            <span>•</span>
                            <span>{friend.matches_played || 0} matches</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMessageFriend(friend.id, friend.username)}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all hover:scale-105 active:scale-95"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Message</span>
                          </button>
                          
                          <button
                            onClick={() => handleAddFavorite(friend.id, friend.is_favorite)}
                            className={`p-2.5 rounded-lg transition-all hover:scale-105 active:scale-95 ${
                              friend.is_favorite 
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            }`}
                            title={friend.is_favorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star className={`w-5 h-5 ${friend.is_favorite ? 'fill-yellow-400' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-4 text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <Users className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No friends found</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                      {searchQuery ? 'No friends match your search. Try a different name or rank.' : 'Start building your gaming network by adding friends!'}
                    </p>
                    <button
                      onClick={() => setShowAddFriend(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-105 active:scale-95"
                    >
                      <UserPlus className="w-5 h-5 inline mr-2" />
                      Add Your First Friend
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'online' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Active Now ({onlineFriends.length})</h3>
                  <p className="text-gray-400">Friends currently online and ready to play</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {onlineFriends.length > 0 ? (
                    onlineFriends.map(friend => (
                      <div key={friend.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-green-500/20 hover:border-green-500/40 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl overflow-hidden">
                              <img 
                                src={friend.profile_pic && friend.profile_pic !== 'default.png' ? `/uploads/${friend.profile_pic}` : '/default-avatar.png'}
                                alt={friend.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{friend.username}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${getRankColor(friend.rank)}`}>
                                {friend.rank || 'E'}
                              </span>
                              <span className="text-xs text-green-400 animate-pulse">● Online</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleMessageFriend(friend.id, friend.username)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Message
                          </button>
                          <span className="text-xs text-gray-400">
                            {friend.win_rate || 0}% WR
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <WifiOff className="w-12 h-12 text-gray-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">No friends online</h3>
                      <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        Your friends will appear here when they come online. Try adding more friends or check back later!
                      </p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => setShowAddFriend(true)}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-105 active:scale-95"
                        >
                          <UserPlus className="w-5 h-5 inline mr-2" />
                          Add More Friends
                        </button>
                        <button
                          onClick={() => setActiveTab('all')}
                          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-all"
                        >
                          View All Friends
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'pending' && (
  <FriendRequests 
    requests={requests}
    onRequestAccepted={(requestId, username) => handleAcceptRequest(requestId, username)}
    onRequestRejected={(requestId, username) => handleRejectRequest(requestId, username)}
    onUpdate={fetchFriendsData}
  />
)}
            
            {activeTab === 'favorites' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Favorite Friends</h3>
                  <p className="text-gray-400">Your closest gaming partners and teammates</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {friends.filter(f => f.is_favorite).length > 0 ? (
                    friends.filter(f => f.is_favorite).map(friend => (
                      <div key={friend.id} className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl overflow-hidden">
                              <img 
                                src={friend.profile_pic && friend.profile_pic !== 'default.png' ? `/uploads/${friend.profile_pic}` : '/default-avatar.png'}
                                alt={friend.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Star className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500 fill-yellow-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{friend.username}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${getRankColor(friend.rank)}`}>
                                {friend.rank || 'E'}
                              </span>
                              <span className={`text-xs ${isUserOnline(friend.id) ? 'text-green-400' : 'text-gray-400'}`}>
                                {isUserOnline(friend.id) ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleAddFavorite(friend.id, true)}
                            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors"
                          >
                            Remove Favorite
                          </button>
                          <span className="text-xs text-gray-400">
                            {friend.win_rate || 0}% WR
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/5 flex items-center justify-center border border-yellow-500/20">
                        <Star className="w-12 h-12 text-yellow-500/40" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">No favorites yet</h3>
                      <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        Mark friends as favorites to see them here. Favorites are great for quick access to your closest gaming partners.
                      </p>
                      <button
                        onClick={() => setActiveTab('all')}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-xl font-medium hover:from-yellow-700 hover:to-amber-700 transition-all hover:scale-105 active:scale-95"
                      >
                        <Star className="w-5 h-5 inline mr-2" />
                        Browse Friends
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-8 p-4 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <div>
                <span className="font-medium text-white">Chat Status: </span>
                <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{stats.total} friends total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-300">{stats.online} online now</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{stats.pending} pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <AddFriendModal
          onClose={() => setShowAddFriend(false)}
          onFriendAdded={fetchFriendsData}
          onFriendRequestSent={handleFriendRequestSent}
        />
      )}
    </div>
  );
};

export default FriendsPage;