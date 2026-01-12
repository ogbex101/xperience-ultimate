import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Edit, Shield, Ban, 
  CheckCircle, XCircle, DollarSign, Trash2,
  UserCheck, UserX, TrendingUp, Users, Crown, Star, 
  Mail, Calendar, CreditCard,
  Save, X, ChevronDown, ChevronUp, Download, Upload,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateBalanceModal, setShowUpdateBalanceModal] = useState(false);
  const [showChangeRankModal, setShowChangeRankModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [selectedRanks, setSelectedRanks] = useState([]);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    firstname: '',
    lastname: '',
    rank: '',
    account_status: 'active',
    xp_points: 0,
    is_admin: false,
    is_banned: false,
    enable_2fa: false,
    login_alerts: true,
    session_timeout: 60,
    bio: '',
    favorite_games: ''
  });
  const [newRank, setNewRank] = useState('E');
  const [rankReason, setRankReason] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  const ranks = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E'];
  const statuses = ['active', 'inactive', 'suspended'];

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    adminCount: 0,
    totalBalance: 0,
    todayRegistered: 0,
    avgXP: 0
  });

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Format currency - CHANGED TO NAIRA
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return `₦${numAmount.toLocaleString('en-NG', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Load all users for stats
  const loadAllUsers = async () => {
    try {
      console.log('📊 Loading all users for stats...');
      const response = await adminAPI.getUsers('', 1, 1000);
      const allUsersData = response.users || [];
      setAllUsers(allUsersData);
      
      // Calculate stats
      const totalUsers = allUsersData.length;
      const activeUsers = allUsersData.filter(u => u.account_status === 'active' && !u.is_banned).length;
      const bannedUsers = allUsersData.filter(u => u.is_banned).length;
      const adminUsers = allUsersData.filter(u => u.is_admin).length;
      const totalBalance = allUsersData.reduce((sum, user) => sum + parseFloat(user.balance || 0), 0);
      
      // Today's registrations
      const today = new Date().toISOString().split('T')[0];
      const todayRegistered = allUsersData.filter(u => 
        u.created_at && u.created_at.startsWith(today)
      ).length;
      
      // Average XP
      const totalXP = allUsersData.reduce((sum, u) => sum + (u.xp_points || 0), 0);
      const avgXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;
      
      setStats({
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        adminCount: adminUsers,
        totalBalance: totalBalance,
        todayRegistered: todayRegistered,
        avgXP: avgXP
      });
      
      return allUsersData;
    } catch (error) {
      console.error('Error loading all users:', error);
      showNotification('Failed to load user stats', 'error');
      return [];
    }
  };

  // Fetch users with filters
  useEffect(() => {
    loadUsers();
  }, [currentPage, filterStatus, filterRank]);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Loading users page ${currentPage}, search: "${searchTerm}"`);
      
      // Call API with search term
      const response = await adminAPI.getUsers(searchTerm, currentPage, 20);
      
      let usersData = response.users || [];
      
      // Client-side filtering
      if (filterStatus) {
        usersData = usersData.filter(user => {
          if (filterStatus === 'banned') return user.is_banned;
          if (filterStatus === 'active') return user.account_status === 'active' && !user.is_banned;
          if (filterStatus === 'suspended') return user.account_status === 'suspended';
          if (filterStatus === 'inactive') return user.account_status === 'inactive';
          return true;
        });
      }
      
      if (filterRank) {
        usersData = usersData.filter(user => user.rank === filterRank);
      }
      
      setUsers(usersData);
      setTotalPages(response.pagination?.totalPages || 1);
      
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Failed to load users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      console.log(`🛠️ Performing action: ${action} on user ${userId}`);
      
      if (action === 'ban' || action === 'unban') {
        const isBan = action === 'ban';
        try {
          const response = await adminAPI.toggleUserBan(userId, isBan, data.reason || 'Admin action');
          if (response?.success) {
            showNotification(`User ${isBan ? 'banned' : 'unbanned'} successfully`);
            loadUsers();
            loadAllUsers();
          }
        } catch (error) {
          console.error('Ban/unban error:', error);
          showNotification(`Failed to ${action} user`, 'error');
        }
      }
      
      else if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          try {
            const response = await adminAPI.deleteUser(userId);
            if (response?.success) {
              showNotification('User deleted successfully');
              loadUsers();
              loadAllUsers();
            }
          } catch (error) {
            console.error('Delete error:', error);
            showNotification('Failed to delete user', 'error');
          }
        }
      }
      
      else if (action === 'update') {
        try {
          const response = await adminAPI.updateUser(userId, editForm);
          if (response?.success) {
            showNotification('User updated successfully');
            setShowEditModal(false);
            loadUsers();
            loadAllUsers();
          }
        } catch (error) {
          console.error('Update error:', error);
          showNotification('Failed to update user', 'error');
        }
      }
      
      else if (action === 'update_rank') {
        try {
          const response = await adminAPI.updateUser(userId, { rank: newRank });
          if (response?.success) {
            showNotification('User rank updated successfully');
            setShowChangeRankModal(false);
            loadUsers();
            loadAllUsers();
          }
        } catch (error) {
          console.error('Update rank error:', error);
          showNotification('Failed to update rank', 'error');
        }
      }
      
    } catch (error) {
      console.error('User action error:', error);
      showNotification(`Failed to ${action} user`, 'error');
    }
  };

  const handleUpdateBalance = async () => {
    try {
      if (!balanceAmount || isNaN(parseFloat(balanceAmount))) {
        showNotification('Please enter a valid amount', 'error');
        return;
      }

      const response = await adminAPI.updateUserBalance(
        selectedUser.id,
        parseFloat(balanceAmount),
        balanceReason
      );
      
      if (response?.success) {
        showNotification('Balance updated successfully');
        setShowUpdateBalanceModal(false);
        setBalanceAmount('');
        setBalanceReason('');
        loadUsers();
        loadAllUsers();
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      showNotification('Failed to update balance', 'error');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username || '',
      email: user.email || '',
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      rank: user.rank || 'E',
      account_status: user.account_status || 'active',
      xp_points: user.xp_points || 0,
      is_admin: user.is_admin || false,
      is_banned: user.is_banned || false,
      enable_2fa: user.enable_2fa || false,
      login_alerts: user.login_alerts !== undefined ? user.login_alerts : true,
      session_timeout: user.session_timeout || 60,
      bio: user.bio || '',
      favorite_games: user.favorite_games || ''
    });
    setShowEditModal(true);
  };

  const openChangeRankModal = (user) => {
    setSelectedUser(user);
    setNewRank(user.rank || 'E');
    setRankReason('');
    setShowChangeRankModal(true);
  };

  const handleExportUsers = () => {
    const csv = [
      ['ID', 'Username', 'Email', 'Rank', 'Status', 'Balance (₦)', 'Matches', 'Wins', 'Win Rate', 'XP', 'Created'],
      ...users.map(user => [
        user.id,
        user.username,
        user.email,
        user.rank,
        user.is_banned ? 'Banned' : user.account_status,
        parseFloat(user.balance || 0).toFixed(2),
        user.matches_played,
        user.wins,
        user.win_rate + '%',
        user.xp_points,
        formatDate(user.created_at)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Users exported to CSV');
  };

  const StatusBadge = ({ status, isBanned }) => {
    if (isBanned) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 w-fit">
          <Ban className="w-3 h-3" /> Banned
        </span>
      );
    }
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1 w-fit">
            <Shield className="w-3 h-3" /> Suspended
          </span>
        );
      case 'inactive':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30 flex items-center gap-1 w-fit">
            Inactive
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
            {status}
          </span>
        );
    }
  };

  const RankBadge = ({ rank }) => {
    const colors = {
      'SSS': 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 border border-purple-500/40',
      'SS': 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-300 border border-blue-500/40',
      'S': 'bg-gradient-to-r from-red-500/30 to-orange-500/30 text-red-300 border border-red-500/40',
      'A': 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-500/40',
      'B': 'bg-gradient-to-r from-green-500/30 to-teal-500/30 text-green-300 border border-green-500/40',
      'C': 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-300 border border-blue-500/40',
      'D': 'bg-gradient-to-r from-gray-500/30 to-gray-600/30 text-gray-300 border border-gray-500/40',
      'E': 'bg-gradient-to-r from-gray-700/30 to-gray-800/30 text-gray-400 border border-gray-600/40'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded ${colors[rank] || colors.E}`}>
        <Crown className="inline w-3 h-3 mr-1" /> {rank}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-green-500/90 to-green-600/90 text-white border border-green-400/50' 
            : 'bg-gradient-to-r from-red-500/90 to-red-600/90 text-white border border-red-400/50'
        } backdrop-blur-sm flex items-center gap-3 animate-slide-in`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification({ show: false, message: '', type: 'success' })}
            className="ml-2 hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-300">Manage all users, update ranks, balances, and permissions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadAllUsers}
            className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:from-blue-600/30 hover:to-blue-700/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleExportUsers}
            className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border border-green-500/30 rounded-lg hover:from-green-600/30 hover:to-green-700/30 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-blue-400">{stats.todayRegistered} new today</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20 hover:border-green-500/40 transition-all">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/20 mr-3">
              <UserCheck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Active Users</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-xs text-green-400">{stats.active > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500/10 to-red-600/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/20 hover:border-red-500/40 transition-all">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-500/20 mr-3">
              <UserX className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Banned Users</p>
              <p className="text-2xl font-bold text-white">{stats.banned}</p>
              <p className="text-xs text-red-400">{stats.banned > 0 ? Math.round((stats.banned / stats.total) * 100) : 0}% of total</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Admins</p>
              <p className="text-2xl font-bold text-white">{stats.adminCount}</p>
              <p className="text-xs text-purple-400">{stats.adminCount > 0 ? Math.round((stats.adminCount / stats.total) * 100) : 0}% of total</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500/20 mr-3">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Balance</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalBalance)}
              </p>
              <p className="text-xs text-yellow-400">Across all users</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-600/20 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-cyan-500/20 mr-3">
              <Star className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Avg XP</p>
              <p className="text-2xl font-bold text-white">
                {stats.avgXP.toLocaleString()}
              </p>
              <p className="text-xs text-cyan-400">Per user average</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by username, email, or wallet..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            
            <div className="relative min-w-[120px]">
              <Crown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={filterRank}
                onChange={(e) => {
                  setFilterRank(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Ranks</option>
                {ranks.map(rank => (
                  <option key={rank} value={rank}>Rank {rank}</option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 font-medium flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Search
            </button>
            
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterRank('');
                setCurrentPage(1);
                loadUsers();
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-gray-700/50 to-gray-800/50 text-gray-300 border border-gray-600/50 rounded-lg hover:from-gray-800/60 hover:to-gray-900/60 transition-all font-medium"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stats</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                      <p className="text-gray-400">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-gray-600 mb-3" />
                      <p className="text-gray-400">No users found</p>
                      <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600"
                            src={user.profile_pic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username) + '&background=374151&color=fff'}
                            alt={user.username}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white flex items-center gap-2">
                            {user.username}
                            {user.is_admin && (
                              <span className="px-1.5 py-0.5 text-xs bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-500/30 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <CreditCard className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{user.wallet_account_number || 'No wallet'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={user.account_status} isBanned={user.is_banned} />
                    </td>
                    <td className="py-3 px-4">
                      <RankBadge rank={user.rank} />
                      <div className="mt-1 text-xs text-gray-400">
                        XP: {user.xp_points?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold text-white">
                        {formatCurrency(user.balance)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.currency || 'NGN'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="w-3 h-3 text-green-400" />
                          <span className="text-gray-300">WR: {user.win_rate || 0}%</span>
                        </div>
                        <div className="text-gray-400 grid grid-cols-2 gap-1">
                          <span>🎮 {user.matches_played || 0}</span>
                          <span>🏆 {user.wins || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-400">
                        {formatDate(user.created_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {user.id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openChangeRankModal(user)}
                          className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors"
                          title="Change Rank"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUpdateBalanceModal(true);
                          }}
                          className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Update Balance"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        {user.is_banned ? (
                          <button
                            onClick={() => handleUserAction('unban', user.id)}
                            className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="Unban User"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction('ban', user.id, { reason: 'Admin action' })}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Ban User"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {!user.is_admin && (
                          <button
                            onClick={() => handleUserAction('delete', user.id)}
                            className="p-1.5 text-gray-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Showing {users.length} users • Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-700/50 hover:to-gray-800/50 transition-colors flex items-center gap-1"
                >
                  <ChevronUp className="w-4 h-4 rotate-90" /> Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-700/50 hover:to-gray-800/50 transition-colors flex items-center gap-1"
                >
                  Next <ChevronUp className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">User Details</h3>
                  <p className="text-sm text-gray-400">ID: {selectedUser.id}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Account Info</label>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500">Username</div>
                        <div className="text-white font-medium">{selectedUser.username}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-white">{selectedUser.email}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Full Name</div>
                        <div className="text-white">
                          {selectedUser.firstname || selectedUser.lastname 
                            ? `${selectedUser.firstname || ''} ${selectedUser.lastname || ''}`
                            : 'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Wallet & Currency</label>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500">Wallet Account</div>
                        <div className="text-white font-mono">{selectedUser.wallet_account_number || 'Not set'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Currency</div>
                        <div className="text-white">{selectedUser.currency || 'NGN'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Account Status</label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">Status</div>
                        <StatusBadge status={selectedUser.account_status} isBanned={selectedUser.is_banned} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">Admin</div>
                        <div className={`px-2 py-1 text-xs rounded ${selectedUser.is_admin ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-300'}`}>
                          {selectedUser.is_admin ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Timestamps</label>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500">Account Created</div>
                        <div className="text-white text-sm">
                          {formatDate(selectedUser.created_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Last Updated</div>
                        <div className="text-white text-sm">
                          {formatDate(selectedUser.updated_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Last Seen</div>
                        <div className="text-white text-sm">
                          {formatDate(selectedUser.last_seen)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Statistics */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">Game Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-sm text-gray-400">Matches Played</div>
                    <div className="text-2xl font-bold text-white">{selectedUser.matches_played || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/20">
                    <div className="text-sm text-gray-400">Wins</div>
                    <div className="text-2xl font-bold text-green-400">{selectedUser.wins || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg p-4 border border-red-500/20">
                    <div className="text-sm text-gray-400">Losses</div>
                    <div className="text-2xl font-bold text-red-400">{selectedUser.losses || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-lg p-4 border border-yellow-500/20">
                    <div className="text-sm text-gray-400">Win Rate</div>
                    <div className="text-2xl font-bold text-yellow-400">{selectedUser.win_rate || 0}%</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="text-sm text-gray-400">Tournaments Played</div>
                    <div className="text-2xl font-bold text-blue-400">{selectedUser.tournaments_played || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-500/20">
                    <div className="text-sm text-gray-400">Tournaments Won</div>
                    <div className="text-2xl font-bold text-purple-400">{selectedUser.tournaments_won || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-lg p-4 border border-cyan-500/20">
                    <div className="text-sm text-gray-400">XP Points</div>
                    <div className="text-2xl font-bold text-cyan-400">{selectedUser.xp_points?.toLocaleString() || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-sm text-gray-400">Balance</div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(selectedUser.balance)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openEditModal(selectedUser);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 border border-yellow-500/30 rounded-lg hover:from-yellow-600/30 hover:to-yellow-700/30 transition-all"
                  >
                    Edit User
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openChangeRankModal(selectedUser);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg hover:from-purple-600/30 hover:to-purple-700/30 transition-all"
                  >
                    Change Rank
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowUpdateBalanceModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border border-green-500/30 rounded-lg hover:from-green-600/30 hover:to-green-700/30 transition-all"
                  >
                    Update Balance
                  </button>
                  {selectedUser.is_banned ? (
                    <button
                      onClick={() => handleUserAction('unban', selectedUser.id)}
                      className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border border-green-500/30 rounded-lg hover:from-green-600/30 hover:to-green-700/30 transition-all"
                    >
                      Unban User
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUserAction('ban', selectedUser.id, { reason: 'Manual ban from details' })}
                      className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:from-red-600/30 hover:to-red-700/30 transition-all"
                    >
                      Ban User
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal - SIMPLIFIED */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Edit User</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rank</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editForm.rank}
                    onChange={(e) => setEditForm({...editForm, rank: e.target.value})}
                  >
                    {ranks.map(rank => (
                      <option key={rank} value={rank}>Rank {rank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Status</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editForm.account_status}
                    onChange={(e) => setEditForm({...editForm, account_status: e.target.value})}
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">XP Points</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editForm.xp_points}
                    onChange={(e) => setEditForm({...editForm, xp_points: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_admin"
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                      checked={editForm.is_admin}
                      onChange={(e) => setEditForm({...editForm, is_admin: e.target.checked})}
                    />
                    <label htmlFor="is_admin" className="ml-2 text-sm text-gray-300">Admin User</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_banned"
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                      checked={editForm.is_banned}
                      onChange={(e) => setEditForm({...editForm, is_banned: e.target.checked})}
                    />
                    <label htmlFor="is_banned" className="ml-2 text-sm text-gray-300">Banned</label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUserAction('update', selectedUser.id)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Save className="inline w-4 h-4 mr-2" /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Rank Modal */}
      {showChangeRankModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Change Rank for {selectedUser.username}</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Current Rank</label>
                <div className="px-3 py-2 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between">
                    <RankBadge rank={selectedUser.rank} />
                    <span className="text-gray-300 text-sm">Current</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">New Rank</label>
                <div className="grid grid-cols-4 gap-2">
                  {ranks.map(rank => (
                    <button
                      key={rank}
                      type="button"
                      onClick={() => setNewRank(rank)}
                      className={`px-3 py-2 rounded-lg border transition-all ${
                        newRank === rank
                          ? 'bg-gradient-to-r from-purple-500/30 to-purple-600/30 text-purple-300 border-purple-500/50'
                          : 'bg-gray-800/30 text-gray-400 border-gray-700 hover:bg-gray-700/30 hover:border-gray-600'
                      }`}
                    >
                      {rank}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowChangeRankModal(false);
                    setRankReason('');
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUserAction('update_rank', selectedUser.id)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <Crown className="inline w-4 h-4 mr-2" /> Update Rank
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Balance Modal */}
      {showUpdateBalanceModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Update Balance for {selectedUser.username}</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Current Balance
                </label>
                <div className="px-3 py-2 bg-gray-800/30 rounded-lg border border-gray-700 text-white">
                  {formatCurrency(selectedUser.balance)}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Enter amount (positive to add, negative to deduct)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use positive values to add, negative to deduct (e.g., -100 to deduct ₦100)
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="Enter reason for balance adjustment"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUpdateBalanceModal(false);
                    setBalanceAmount('');
                    setBalanceReason('');
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateBalance}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <DollarSign className="inline w-4 h-4 mr-2" /> Update Balance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;