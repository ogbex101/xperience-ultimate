import React, { useState, useEffect } from 'react';
import {
  Users,
  Wallet,
  TrendingUp,
  Download,
  AlertCircle,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Settings,
  UserPlus,
  AlertTriangle,
  Loader2,
  Trophy,
  Swords,
  Users as UsersGroup,
  Calendar,
  Gamepad2,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_balance: 0,
    total_xp: 0,
    pending_withdrawals: 0,
    today_transactions: 0,
    today_deposits: 0,
    active_fraud_flags: 0,
    ongoing_matches: 0,
    ongoing_tournaments: 0,
    today_groups: 0,
    total_groups: 0
  });
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [ongoingMatches, setOngoingMatches] = useState([]);
  const [ongoingTournaments, setOngoingTournaments] = useState([]);
  const [recentGroups, setRecentGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      const statsResponse = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Dashboard API Response Status:', statsResponse.status);
      
      if (statsResponse.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      
      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        console.error('Dashboard API Error:', errorText);
        throw new Error(`HTTP error! status: ${statsResponse.status}`);
      }
      
      const statsData = await statsResponse.json();
      console.log('Dashboard API Data:', statsData);
      
      if (statsData.success) {
        setStats(statsData.stats || {
          total_users: 0,
          total_balance: 0,
          total_xp: 0,
          pending_withdrawals: 0,
          today_transactions: 0,
          today_deposits: 0,
          active_fraud_flags: 0,
          ongoing_matches: 0,
          ongoing_tournaments: 0,
          today_groups: 0,
          total_groups: 0
        });
        setRecentWithdrawals(statsData.recent_withdrawals || []);
        setRecentUsers(statsData.recent_users || []);
        setOngoingMatches(statsData.ongoing_matches || []);
        setOngoingTournaments(statsData.ongoing_tournaments || []);
        setRecentGroups(statsData.recent_groups || []);
      } else {
        throw new Error(statsData.message || 'Failed to fetch dashboard data');
      }
      
    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      setError(`Failed to load dashboard: ${error.message}`);
      
      // Set empty state
      setStats({
        total_users: 0,
        total_balance: 0,
        total_xp: 0,
        pending_withdrawals: 0,
        today_transactions: 0,
        today_deposits: 0,
        active_fraud_flags: 0,
        ongoing_matches: 0,
        ongoing_tournaments: 0,
        today_groups: 0,
        total_groups: 0
      });
      setRecentWithdrawals([]);
      setRecentUsers([]);
      setOngoingMatches([]);
      setOngoingTournaments([]);
      setRecentGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString('en-NG')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTournamentTypeIcon = (type) => {
    switch(type) {
      case '1v1': return '⚔️';
      case 'survival': return '🏆';
      case 'freeforall': return '👥';
      case 'squad': return '🛡️';
      default: return '🎮';
    }
  };

  const getMatchTypeIcon = (gameType) => {
    switch(gameType) {
      case 'individual': return '👤';
      case 'group': return '👥';
      case 'school': return '🏫';
      case 'institution': return '🏢';
      default: return '🎯';
    }
  };

  const statsCards = [
    {
      id: 'total_users',
      title: 'Total Users',
      value: stats.total_users || 0,
      icon: Users,
      color: 'from-blue-600 to-cyan-600',
      description: 'Registered platform users'
    },
    {
      id: 'total_balance',
      title: 'Total Balance',
      value: formatCurrency(stats.total_balance),
      icon: Wallet,
      color: 'from-green-600 to-emerald-600',
      description: 'Total user balances'
    },
    {
      id: 'pending_withdrawals',
      title: 'Pending Withdrawals',
      value: stats.pending_withdrawals || 0,
      icon: Download,
      color: 'from-yellow-600 to-orange-600',
      description: 'Awaiting approval'
    },
    {
      id: 'today_deposits',
      title: "Today's Deposits",
      value: formatCurrency(stats.today_deposits),
      icon: TrendingUp,
      color: 'from-purple-600 to-pink-600',
      description: 'Deposits made today'
    },
    {
      id: 'ongoing_matches',
      title: 'Ongoing Matches',
      value: stats.ongoing_matches || 0,
      icon: Swords,
      color: 'from-red-600 to-orange-600',
      description: 'Active matches'
    },
    {
      id: 'ongoing_tournaments',
      title: 'Ongoing Tournaments',
      value: stats.ongoing_tournaments || 0,
      icon: Trophy,
      color: 'from-yellow-500 to-amber-600',
      description: 'Active tournaments'
    }
  ];

  const additionalStatsCards = [
    {
      id: 'total_xp',
      title: 'Total XP Points',
      value: (stats.total_xp || 0).toLocaleString(),
      icon: Coins,
      color: 'from-yellow-400 to-yellow-600',
      description: 'Total XP across platform'
    },
    {
      id: 'active_fraud_flags',
      title: 'Active Fraud Flags',
      value: stats.active_fraud_flags || 0,
      icon: AlertCircle,
      color: 'from-red-600 to-rose-600',
      description: 'Requires investigation'
    },
    {
      id: 'total_groups',
      title: 'Total Groups',
      value: stats.total_groups || 0,
      icon: UsersGroup,
      color: 'from-green-500 to-teal-600',
      description: 'All platform groups'
    },
    {
      id: 'today_groups',
      title: "Today's Groups",
      value: stats.today_groups || 0,
      icon: UserPlus,
      color: 'from-blue-500 to-indigo-600',
      description: 'Groups created today'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Real-time platform overview</p>
          {error && (
            <div className="mt-2 flex items-center bg-red-900/20 border border-red-800/30 text-red-400 text-sm px-4 py-2 rounded-lg">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 text-white self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {card.id === 'pending_withdrawals' && stats.pending_withdrawals > 0 && (
                  <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-xs font-medium">
                    Needs Attention
                  </span>
                )}
                {card.id === 'active_fraud_flags' && stats.active_fraud_flags > 0 && (
                  <span className="px-2 py-1 bg-red-900/30 text-red-300 rounded-full text-xs font-medium">
                    Critical
                  </span>
                )}
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{card.value}</h3>
              <p className="text-gray-300 font-medium">{card.title}</p>
              <p className="text-sm text-gray-500 mt-1">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {additionalStatsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4"
            >
              <div className="flex items-center mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${card.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-gray-400 ml-2">{card.title}</p>
              </div>
              <h4 className="text-xl font-bold text-white">{card.value}</h4>
            </div>
          );
        })}
      </div>

      {/* Ongoing Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Ongoing Tournaments */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                Ongoing Tournaments
              </h2>
              <p className="text-sm text-gray-400">Active tournaments requiring monitoring</p>
            </div>
            <div className="flex items-center space-x-2">
              {stats.ongoing_tournaments > 0 && (
                <span className="px-3 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-sm font-medium">
                  {stats.ongoing_tournaments} active
                </span>
              )}
              <button 
                onClick={() => navigate('/admin/tournaments')}
                className="text-sm text-gray-400 hover:text-white"
              >
                View all
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {ongoingTournaments.length > 0 ? (
              ongoingTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-yellow-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{getTournamentTypeIcon(tournament.type)}</span>
                        <div className="font-semibold text-white truncate">
                          {tournament.name}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 flex items-center space-x-3">
                        <span className="flex items-center">
                          <Gamepad2 className="h-3 w-3 mr-1" />
                          {tournament.game}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {tournament.max_players} players
                        </span>
                        <span className="flex items-center text-yellow-400">
                          <Trophy className="h-3 w-3 mr-1" />
                          {formatCurrency(tournament.prize_pool || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Creator</div>
                      <div className="text-sm font-medium text-white">
                        {tournament.creator_username || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/30">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
                        {tournament.type || '1v1'}
                      </span>
                      <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs">
                        {tournament.currency === 'xp' ? 'XP' : 'Money'}
                      </span>
                      {tournament.start_date && (
                        <span className="text-xs text-gray-400 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatTime(tournament.start_date)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                      className="text-sm text-purple-400 hover:text-purple-300 font-medium hover:underline"
                    >
                      Monitor →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-gray-400">No ongoing tournaments</p>
                <p className="text-sm text-gray-500 mt-1">All tournaments are completed or upcoming</p>
              </div>
            )}
          </div>
        </div>

        {/* Ongoing Matches */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <Swords className="h-5 w-5 mr-2 text-red-400" />
                Ongoing Matches
              </h2>
              <p className="text-sm text-gray-400">Active 1v1 matches</p>
            </div>
            <div className="flex items-center space-x-2">
              {stats.ongoing_matches > 0 && (
                <span className="px-3 py-1 bg-red-900/30 text-red-300 rounded-full text-sm font-medium">
                  {stats.ongoing_matches} active
                </span>
              )}
              <button 
                onClick={() => navigate('/admin/matches')}
                className="text-sm text-gray-400 hover:text-white"
              >
                View all
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {ongoingMatches.length > 0 ? (
              ongoingMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-red-800/50 transition-colors"
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getMatchTypeIcon(match.game_type)}</span>
                        <span className="font-medium text-white">
                          {match.game || 'Unknown Game'}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(match.stake_amount)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-400 truncate max-w-[100px]">
                          {match.player1_username || 'Player 1'}
                        </div>
                        <div className="text-xs text-gray-400">VS</div>
                        <div className="font-semibold text-red-400 truncate max-w-[100px]">
                          {match.player2_username || 'Player 2'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Prize Pool</div>
                        <div className="font-bold text-yellow-400">
                          {formatCurrency(match.prize_pool_amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        match.stake_currency === 'xp' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-green-900/30 text-green-300'
                      }`}>
                        {match.stake_currency === 'xp' ? 'XP Match' : 'Money Match'}
                      </span>
                      {match.admin_monitoring && (
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs">
                          <Shield className="h-3 w-3 inline mr-1" />
                          Monitored
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/admin/matches/${match.id}`)}
                      className="text-sm text-red-400 hover:text-red-300 font-medium hover:underline"
                    >
                      Watch →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Swords className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-gray-400">No ongoing matches</p>
                <p className="text-sm text-gray-500 mt-1">All matches are completed or pending</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Groups & Withdrawals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Groups */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <UsersGroup className="h-5 w-5 mr-2 text-green-400" />
                Recently Created Groups
              </h2>
              <p className="text-sm text-gray-400">New platform groups</p>
            </div>
            <div className="flex items-center space-x-2">
              {recentGroups.length > 0 && (
                <span className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-sm font-medium">
                  {recentGroups.length} new
                </span>
              )}
              <button 
                onClick={() => navigate('/admin/groups')}
                className="text-sm text-gray-400 hover:text-white"
              >
                View all
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {recentGroups.length > 0 ? (
              recentGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-green-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">
                        {group.name}
                      </div>
                      <div className="text-sm text-gray-400 line-clamp-2">
                        {group.description || 'No description'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Members</div>
                      <div className="text-lg font-bold text-white">
                        {group.member_count || 0}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-gray-300 flex items-center">
                        <Gamepad2 className="h-3 w-3 mr-1" />
                        {group.game_specialty}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        group.visibility === 'public' ? 'bg-blue-900/30 text-blue-300' : 'bg-gray-700/50 text-gray-300'
                      }`}>
                        {group.visibility}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {formatDate(group.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      by {group.creator_username || 'Unknown'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UsersGroup className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-gray-400">No groups created yet</p>
                <p className="text-sm text-gray-500 mt-1">Groups will appear here when created</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Withdrawals (existing) */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <Download className="h-5 w-5 mr-2 text-yellow-400" />
                Recent Withdrawal Requests
              </h2>
              <p className="text-sm text-gray-400">Requires admin approval</p>
            </div>
            <div className="flex items-center space-x-2">
              {stats.pending_withdrawals > 0 && (
                <span className="px-3 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-sm font-medium">
                  {stats.pending_withdrawals} pending
                </span>
              )}
              <button 
                onClick={() => navigate('/admin/withdrawals')}
                className="text-sm text-gray-400 hover:text-white"
              >
                View all
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {recentWithdrawals.length > 0 ? (
              recentWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-yellow-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-white">
                        {withdrawal.username || `User #${withdrawal.user_id}`}
                      </div>
                      <div className="text-sm text-gray-400">
                        {withdrawal.email || 'No email'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(withdrawal.amount)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(withdrawal.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
                        {withdrawal.receipt_number || `Receipt #${withdrawal.id}`}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        withdrawal.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                        withdrawal.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                        withdrawal.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                        'bg-gray-700/50 text-gray-400'
                      }`}>
                        {withdrawal.status || 'pending'}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/withdrawals/${withdrawal.id}`)}
                      className="text-sm text-purple-400 hover:text-purple-300 font-medium hover:underline"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Download className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-gray-400">No pending withdrawal requests</p>
                <p className="text-sm text-gray-500 mt-1">All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/withdrawals')}
            className="p-4 bg-gray-800/30 border border-gray-700/30 rounded-xl hover:border-yellow-700/50 transition-all duration-200 text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-900/30 rounded-lg group-hover:bg-yellow-800/30 transition-colors">
                <Download className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Process Withdrawals</div>
                <div className="text-sm text-gray-400">Approve pending requests</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/tournaments')}
            className="p-4 bg-gray-800/30 border border-gray-700/30 rounded-xl hover:border-yellow-700/50 transition-all duration-200 text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-900/30 rounded-lg group-hover:bg-yellow-800/30 transition-colors">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Monitor Tournaments</div>
                <div className="text-sm text-gray-400">View ongoing tournaments</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/matches')}
            className="p-4 bg-gray-800/30 border border-gray-700/30 rounded-xl hover:border-red-700/50 transition-all duration-200 text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-900/30 rounded-lg group-hover:bg-red-800/30 transition-colors">
                <Swords className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Watch Matches</div>
                <div className="text-sm text-gray-400">Monitor live matches</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/groups')}
            className="p-4 bg-gray-800/30 border border-gray-700/30 rounded-xl hover:border-green-700/50 transition-all duration-200 text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-900/30 rounded-lg group-hover:bg-green-800/30 transition-colors">
                <UsersGroup className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Manage Groups</div>
                <div className="text-sm text-gray-400">View and manage groups</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 
          Data fetched from live database
        </p>
      </div>
    </>
  );
};

export default AdminDashboard;