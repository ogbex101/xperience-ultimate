import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, Trophy, Users, Clock,
  Play, CheckCircle, XCircle, AlertTriangle,
  Award, Target, BarChart3, Crown, Shield,
  Zap, DollarSign, History, TrendingUp,
  Calendar, UserCheck, FileText, RefreshCw
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const MatchesManagement = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGameType, setFilterGameType] = useState('');
  const [filterAdminMonitoring, setFilterAdminMonitoring] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [winnerId, setWinnerId] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ongoing: 0,
    completed: 0,
    totalStake: 0,
    adminMonitored: 0,
    totalPrize: 0
  });
  const [adminMonitoredMatches, setAdminMonitoredMatches] = useState([]);

  useEffect(() => {
    loadMatches();
    loadStats();
    loadAdminMonitoredMatches();
  }, [currentPage, filterStatus, filterGameType, filterAdminMonitoring]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getMatches(
        filterStatus, 
        filterGameType, 
        filterAdminMonitoring,
        currentPage, 
        20,
        searchTerm
      );
      setMatches(response.matches || response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminMonitoredMatches = async () => {
    try {
      const response = await adminAPI.getMatches('', '', 'monitored', 1, 10);
      setAdminMonitoredMatches(response.matches || []);
    } catch (error) {
      console.error('Error loading admin monitored matches:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getMatchStats();
      if (response.stats) {
        setStats({
          total: response.stats.total || 0,
          pending: response.stats.pending || 0,
          ongoing: response.stats.ongoing || 0,
          completed: response.stats.completed || 0,
          totalStake: response.stats.totalStake || 0,
          adminMonitored: response.stats.adminMonitored || 0,
          totalPrize: response.stats.totalPrize || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAuditLogs = async (matchId) => {
    try {
      const response = await adminAPI.getMatchAuditLogs(matchId);
      setAuditLogs(response.logs || []);
      setShowAuditLogs(true);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setAuditLogs([]);
      setShowAuditLogs(true);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadMatches();
  };

  const handleResolveDispute = async (matchId) => {
    try {
      const response = await adminAPI.resolveMatchDispute(matchId, winnerId, adminNotes);
      if (response?.success) {
        setShowResolveModal(false);
        setWinnerId('');
        setAdminNotes('');
        loadMatches();
        loadStats();
        loadAdminMonitoredMatches();
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  const handleCancelMatch = async (matchId) => {
    if (window.confirm('Are you sure you want to cancel this match?')) {
      try {
        const response = await adminAPI.cancelMatch(matchId, 'Cancelled by admin');
        if (response?.success) {
          loadMatches();
          loadStats();
          loadAdminMonitoredMatches();
        }
      } catch (error) {
        console.error('Error cancelling match:', error);
      }
    }
  };

  const handleToggleAdminMonitoring = async (matchId, currentStatus) => {
    const newStatus = currentStatus ? 0 : 1;
    const action = newStatus ? 'enable' : 'disable';
    
    if (window.confirm(`Are you sure you want to ${action} admin monitoring for this match?`)) {
      try {
        const response = await adminAPI.toggleAdminMonitoring(matchId, newStatus);
        if (response?.success) {
          loadMatches();
          loadStats();
          loadAdminMonitoredMatches();
        }
      } catch (error) {
        console.error(`Error ${action} admin monitoring:`, error);
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'ongoing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    
    const icons = {
      'pending': <Clock className="w-3 h-3 mr-1" />,
      'ongoing': <Play className="w-3 h-3 mr-1" />,
      'completed': <CheckCircle className="w-3 h-3 mr-1" />
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${colors[status] || colors.pending}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const GameTypeBadge = ({ type }) => {
    const colors = {
      'individual': 'bg-purple-100 text-purple-800',
      'group': 'bg-blue-100 text-blue-800',
      'school': 'bg-green-100 text-green-800',
      'institution': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[type] || colors.individual}`}>
        {type}
      </span>
    );
  };

  const AdminMonitoringBadge = ({ monitored }) => {
    if (!monitored) return null;
    
    return (
      <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 flex items-center">
        <Shield className="w-3 h-3 mr-1" />
        Admin Monitored
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const AuditLogItem = ({ log }) => {
    const getActionColor = (action) => {
      switch(action) {
        case 'resolved_dispute': return 'text-green-400';
        case 'overrode_result': return 'text-red-400';
        case 'joined_match': return 'text-blue-400';
        case 'warned_player': return 'text-yellow-400';
        default: return 'text-gray-400';
      }
    };

    return (
      <div className="py-3 px-4 border-b border-gray-800/50 last:border-0">
        <div className="flex justify-between items-start">
          <div>
            <span className={`text-sm font-medium ${getActionColor(log.action_type)}`}>
              {log.action_type.replace('_', ' ').toUpperCase()}
            </span>
            {log.admin_username && (
              <span className="ml-2 text-xs text-gray-400">by {log.admin_username}</span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {new Date(log.created_at).toLocaleString()}
          </span>
        </div>
        {log.details && (
          <div className="mt-2 text-xs text-gray-300">
            {Object.entries(JSON.parse(log.details || '{}')).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="text-gray-400 w-24">{key.replace('_', ' ')}:</span>
                <span className="flex-1">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
        {log.ip_address && (
          <div className="mt-1 text-xs text-gray-500">IP: {log.ip_address}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Matches Management</h1>
            <p className="text-gray-300">Manage game matches, resolve disputes, and monitor match activity</p>
          </div>
          <button
            onClick={() => {
              loadMatches();
              loadStats();
              loadAdminMonitoredMatches();
            }}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Matches</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500/20 mr-3">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Pending</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
              <Play className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Ongoing</p>
              <p className="text-2xl font-bold text-white">{stats.ongoing}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/20 mr-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Completed</p>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Admin Monitored</p>
              <p className="text-2xl font-bold text-white">{stats.adminMonitored}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/20 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-amber-500/20 mr-3">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Stake</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalStake)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-emerald-500/20 mr-3">
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Prize</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPrize)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Monitored Matches Section */}
      {adminMonitoredMatches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-purple-400 mr-2" />
            <h2 className="text-lg font-bold text-white">Admin Monitored Matches</h2>
            <span className="ml-2 px-2 py-1 text-xs font-semibold bg-purple-500/20 text-purple-300 rounded-full">
              {adminMonitoredMatches.length} Active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminMonitoredMatches.slice(0, 4).map((match) => (
              <div key={match.id} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white">Match #{match.id}</h3>
                    <p className="text-sm text-gray-400">{match.game || 'Unknown Game'}</p>
                  </div>
                  <StatusBadge status={match.status} />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Stake:</span>
                    <span className="text-white font-semibold">{formatCurrency(match.stake_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Prize:</span>
                    <span className="text-green-400 font-semibold">{formatCurrency(match.prize_pool_amount || match.custom_prize_pool || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Players:</span>
                    <span className="text-white">
                      {match.player1_username} vs {match.player2_username || 'Waiting...'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMatch(match);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                  >
                    View
                  </button>
                  {match.status === 'ongoing' && (
                    <button
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowResolveModal(true);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by match ID, player names, game, or tournament..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status Filter</label>
            <select
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Game Type Filter</label>
            <select
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterGameType}
              onChange={(e) => setFilterGameType(e.target.value)}
            >
              <option value="">All Game Types</option>
              <option value="individual">Individual</option>
              <option value="group">Group</option>
              <option value="school">School</option>
              <option value="institution">Institution</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Admin Monitoring</label>
            <select
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={filterAdminMonitoring}
              onChange={(e) => setFilterAdminMonitoring(e.target.value)}
            >
              <option value="">All Matches</option>
              <option value="monitored">Admin Monitored Only</option>
              <option value="not-monitored">Not Admin Monitored</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Results Per Page</label>
            <select
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => setCurrentPage(1)}
            >
              <option value="20">20 matches</option>
              <option value="50">50 matches</option>
              <option value="100">100 matches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Match Details</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Players</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stake & Prize</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Schedule</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                      Loading matches...
                    </div>
                  </td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <Search className="w-12 h-12 text-gray-600 mb-2" />
                      No matches found
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                matches.map((match) => (
                  <tr key={match.id} className={`hover:bg-gray-800/30 transition-colors ${match.admin_monitoring ? 'border-l-2 border-l-purple-500' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-start">
                        <div>
                          <div className="text-sm font-medium text-white flex items-center">
                            Match #{match.id}
                            <AdminMonitoringBadge monitored={match.admin_monitoring} />
                          </div>
                          <div className="text-xs text-gray-400">{match.game || 'No game specified'}</div>
                          <div className="mt-1">
                            <GameTypeBadge type={match.game_type} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${match.winner_id === match.player1_id ? 'bg-green-400' : 'bg-gray-400'} mr-2`}></div>
                          <span className="text-sm text-white">
                            {match.player1_username || `Player #${match.player1_id}`}
                            {match.winner_id === match.player1_id && (
                              <Crown className="inline w-3 h-3 ml-1 text-yellow-400" />
                            )}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${match.winner_id === match.player2_id ? 'bg-green-400' : 'bg-gray-400'} mr-2`}></div>
                          <span className="text-sm text-white">
                            {match.player2_username ? match.player2_username : (match.player2_id ? `Player #${match.player2_id}` : 'Waiting...')}
                            {match.winner_id === match.player2_id && (
                              <Crown className="inline w-3 h-3 ml-1 text-yellow-400" />
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Stake:</span>
                          <span className="text-sm text-white font-semibold">
                            {formatCurrency(match.stake_amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Prize:</span>
                          <span className="text-sm text-green-400 font-semibold">
                            {formatCurrency(match.prize_pool_amount || match.custom_prize_pool || 0)}
                          </span>
                        </div>
                        {match.stake_xp_amount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">XP Stake:</span>
                            <span className="text-sm text-yellow-400 font-semibold">
                              {match.stake_xp_amount} XP
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-2">
                        <StatusBadge status={match.status} />
                        {match.admin_monitoring && (
                          <div className="text-xs text-purple-400 flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin Monitored
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="text-gray-400">
                          {match.created_at ? (
                            <>
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(match.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 ml-4">
                                {new Date(match.created_at).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            'Not scheduled'
                          )}
                        </div>
                        {match.started_at && (
                          <div className="text-xs text-blue-400 mt-1">
                            Started: {new Date(match.started_at).toLocaleTimeString()}
                          </div>
                        )}
                        {match.completed_at && (
                          <div className="text-xs text-green-400 mt-1">
                            Completed: {new Date(match.completed_at).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedMatch(match);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => loadAuditLogs(match.id)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-500/20 rounded-lg transition-colors"
                          title="View Audit Logs"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        
                        {match.status === 'ongoing' && !match.winner_id && (
                          <button
                            onClick={() => {
                              setSelectedMatch(match);
                              setShowResolveModal(true);
                            }}
                            className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                            title="Resolve Dispute"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(match.status === 'pending' || match.status === 'ongoing') && (
                          <button
                            onClick={() => handleCancelMatch(match.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Cancel Match"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleAdminMonitoring(match.id, match.admin_monitoring)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            match.admin_monitoring 
                              ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/20' 
                              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-500/20'
                          }`}
                          title={match.admin_monitoring ? "Disable Admin Monitoring" : "Enable Admin Monitoring"}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800/50 bg-gray-800/30">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-400 mb-2 md:mb-0">
                Showing page {currentPage} of {totalPages} • {matches.length} matches
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors flex items-center"
                >
                  Previous
                </button>
                <div className="px-3 py-1 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-white">
                  {currentPage}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors flex items-center"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Match Details Modal */}
      {showDetailsModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <h3 className="text-xl font-bold text-white mr-3">Match Details #{selectedMatch.id}</h3>
                  {selectedMatch.admin_monitoring && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin Monitored
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Basic Info</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Game</label>
                        <div className="text-white">{selectedMatch.game || 'Not specified'}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Game Type</label>
                        <GameTypeBadge type={selectedMatch.game_type} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <StatusBadge status={selectedMatch.status} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Timeline</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">{new Date(selectedMatch.created_at).toLocaleString()}</span>
                      </div>
                      {selectedMatch.scheduled_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Scheduled:</span>
                          <span className="text-blue-400">{new Date(selectedMatch.scheduled_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedMatch.started_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Started:</span>
                          <span className="text-blue-400">{new Date(selectedMatch.started_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedMatch.completed_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Completed:</span>
                          <span className="text-green-400">{new Date(selectedMatch.completed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Financial Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Stake Amount</label>
                        <div className="text-white text-xl font-bold">
                          {formatCurrency(selectedMatch.stake_amount)}
                        </div>
                        {selectedMatch.stake_currency === 'xp' && selectedMatch.stake_xp_amount > 0 && (
                          <div className="text-sm text-yellow-400 mt-1">
                            + {selectedMatch.stake_xp_amount} XP
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Prize Pool</label>
                        <div className="text-green-400 text-xl font-bold">
                          {formatCurrency(selectedMatch.prize_pool_amount || selectedMatch.custom_prize_pool || 0)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Prize Pool Option</label>
                        <div className="text-white">{selectedMatch.prize_pool_option}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Match Settings</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Opponent Type</label>
                        <div className="text-white text-sm">{selectedMatch.opponent_type}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Chat Enabled</label>
                        <div className={`text-sm ${selectedMatch.match_chat_enabled ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedMatch.match_chat_enabled ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                        <div className="text-white text-sm">
                          {selectedMatch.duration_minutes ? `${selectedMatch.duration_minutes} mins` : 'Not set'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                        <div className="text-white text-sm">{selectedMatch.stake_currency_type}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Players Information</h4>
                    <div className="space-y-4">
                      <div className={`p-3 rounded-lg ${selectedMatch.winner_id === selectedMatch.player1_id ? 'bg-green-900/20 border border-green-500/30' : 'bg-gray-800/50'}`}>
                        <h5 className="font-medium text-white mb-2 flex items-center">
                          Player 1 {selectedMatch.winner_id === selectedMatch.player1_id && (
                            <Crown className="ml-2 w-4 h-4 text-yellow-400" />
                          )}
                        </h5>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Username:</span>
                            <span className="text-white">{selectedMatch.player1_username || `#${selectedMatch.player1_id}`}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">ID:</span>
                            <span className="text-gray-300">#{selectedMatch.player1_id}</span>
                          </div>
                          {selectedMatch.player1_email && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Email:</span>
                              <span className="text-gray-300">{selectedMatch.player1_email}</span>
                            </div>
                          )}
                        </div>
                        {selectedMatch.winner_id === selectedMatch.player1_id && (
                          <div className="mt-2 inline-flex items-center px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                            <Trophy className="w-3 h-3 mr-1" /> Winner
                          </div>
                        )}
                      </div>
                      
                      <div className={`p-3 rounded-lg ${selectedMatch.winner_id === selectedMatch.player2_id ? 'bg-green-900/20 border border-green-500/30' : 'bg-gray-800/50'}`}>
                        <h5 className="font-medium text-white mb-2 flex items-center">
                          Player 2 {selectedMatch.winner_id === selectedMatch.player2_id && (
                            <Crown className="ml-2 w-4 h-4 text-yellow-400" />
                          )}
                        </h5>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Username:</span>
                            <span className="text-white">
                              {selectedMatch.player2_username ? selectedMatch.player2_username : (selectedMatch.player2_id ? `#${selectedMatch.player2_id}` : 'Not assigned')}
                            </span>
                          </div>
                          {selectedMatch.player2_id && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-400">ID:</span>
                                <span className="text-gray-300">#{selectedMatch.player2_id}</span>
                              </div>
                              {selectedMatch.player2_email && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Email:</span>
                                  <span className="text-gray-300">{selectedMatch.player2_email}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {selectedMatch.winner_id === selectedMatch.player2_id && (
                          <div className="mt-2 inline-flex items-center px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                            <Trophy className="w-3 h-3 mr-1" /> Winner
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-white">Match Actions</h4>
                  <button
                    onClick={loadAuditLogs}
                    className="px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors flex items-center"
                  >
                    <History className="w-3 h-3 mr-2" />
                    View Audit Logs
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedMatch.status === 'ongoing' && !selectedMatch.winner_id && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowResolveModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 flex items-center"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Resolve Dispute
                    </button>
                  )}
                  {(selectedMatch.status === 'pending' || selectedMatch.status === 'ongoing') && (
                    <button
                      onClick={() => {
                        handleCancelMatch(selectedMatch.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Match
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleAdminMonitoring(selectedMatch.id, selectedMatch.admin_monitoring)}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      selectedMatch.admin_monitoring 
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30' 
                        : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {selectedMatch.admin_monitoring ? 'Disable' : 'Enable'} Admin Monitoring
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {showResolveModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400 mr-2" />
                <h3 className="text-xl font-bold text-white">Resolve Match Dispute</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-4">Select the winner for Match #{selectedMatch.id}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <input
                      type="radio"
                      id="player1"
                      name="winner"
                      value={selectedMatch.player1_id}
                      checked={winnerId === selectedMatch.player1_id.toString()}
                      onChange={(e) => setWinnerId(e.target.value)}
                      className="mr-3"
                    />
                    <label htmlFor="player1" className="text-white flex-1">
                      <div className="font-medium">{selectedMatch.player1_username || `Player #${selectedMatch.player1_id}`}</div>
                      <div className="text-xs text-gray-400">ID: #{selectedMatch.player1_id}</div>
                    </label>
                  </div>
                  
                  {selectedMatch.player2_id && (
                    <div className="flex items-center p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <input
                        type="radio"
                        id="player2"
                        name="winner"
                        value={selectedMatch.player2_id}
                        checked={winnerId === selectedMatch.player2_id?.toString()}
                        onChange={(e) => setWinnerId(e.target.value)}
                        className="mr-3"
                      />
                      <label htmlFor="player2" className="text-white flex-1">
                        <div className="font-medium">{selectedMatch.player2_username || `Player #${selectedMatch.player2_id}`}</div>
                        <div className="text-xs text-gray-400">ID: #{selectedMatch.player2_id}</div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Admin Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter notes about this resolution..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedMatch.admin_monitoring ? 
                    "This is an admin-monitored match. Your decision is final." : 
                    "Notes will be recorded in the audit log."}
                </p>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Prize Distribution</h4>
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Prize Pool:</span>
                    <span className="text-green-400 font-semibold">
                      {formatCurrency(selectedMatch.prize_pool_amount || selectedMatch.custom_prize_pool || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Will be credited to:</span>
                    <span className="text-white font-semibold">
                      {winnerId === selectedMatch.player1_id?.toString() ? 
                        (selectedMatch.player1_username || `Player #${selectedMatch.player1_id}`) : 
                        (selectedMatch.player2_username || `Player #${selectedMatch.player2_id}`)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setWinnerId('');
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResolveDispute(selectedMatch.id)}
                  disabled={!winnerId}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {selectedMatch.admin_monitoring ? 'Final Decision' : 'Resolve Match'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && selectedMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Audit Logs for Match #{selectedMatch.id}</h3>
                  <p className="text-gray-400">Complete history of admin actions</p>
                </div>
                <button
                  onClick={() => setShowAuditLogs(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Match Status</div>
                    <div className="text-white font-medium">
                      <StatusBadge status={selectedMatch.status} />
                    </div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Admin Monitoring</div>
                    <div className={`font-medium ${selectedMatch.admin_monitoring ? 'text-purple-400' : 'text-gray-400'}`}>
                      {selectedMatch.admin_monitoring ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Total Stake</div>
                    <div className="text-white font-medium">{formatCurrency(selectedMatch.stake_amount)}</div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Total Actions</div>
                    <div className="text-white font-medium">{auditLogs.length}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/20 rounded-xl border border-gray-700/50">
                <div className="p-4 border-b border-gray-800/50">
                  <h4 className="text-sm font-medium text-white">Action History</h4>
                </div>
                <div className="divide-y divide-gray-800/50">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, index) => (
                      <AuditLogItem key={index} log={log} />
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No audit logs found for this match</p>
                      <p className="text-sm mt-1">Actions will appear here as they occur</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAuditLogs(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesManagement;