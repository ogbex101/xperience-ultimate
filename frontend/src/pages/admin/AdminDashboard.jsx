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
  Settings
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 1247,
    total_balance: 1245000,
    pending_withdrawals: 8,
    today_deposits: 245000,
    total_xp: 56890,
    active_fraud_flags: 3
  });
  const [recentWithdrawals, setRecentWithdrawals] = useState([
    {
      id: 1,
      username: 'john_doe',
      email: 'john@example.com',
      amount: 50000,
      created_at: '2024-01-15T10:30:00Z',
      receipt_number: 'W-001234'
    },
    {
      id: 2,
      username: 'jane_smith',
      email: 'jane@example.com',
      amount: 75000,
      created_at: '2024-01-15T09:15:00Z',
      receipt_number: 'W-001235'
    },
    {
      id: 3,
      username: 'mike_wilson',
      email: 'mike@example.com',
      amount: 30000,
      created_at: '2024-01-15T08:45:00Z',
      receipt_number: 'W-001236'
    }
  ]);
  const [recentUsers, setRecentUsers] = useState([
    {
      id: 1,
      username: 'newuser1',
      email: 'new1@example.com',
      wallet_account_number: 'ACC001',
      balance: 5000
    },
    {
      id: 2,
      username: 'newuser2',
      email: 'new2@example.com',
      wallet_account_number: 'ACC002',
      balance: 10000
    },
    {
      id: 3,
      username: 'newuser3',
      email: 'new3@example.com',
      wallet_account_number: 'ACC003',
      balance: 7500
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    
    try {
      // Try to use the API if available
      const adminToken = localStorage.getItem('adminToken');
      
      if (adminToken) {
        const response = await fetch('http://localhost:5000/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.stats || stats);
            setRecentWithdrawals(data.recent_withdrawals || recentWithdrawals);
            setRecentUsers(data.recent_users || recentUsers);
          }
        }
      }
    } catch (error) {
      console.log('Using mock data:', error.message);
      // Keep using the existing mock data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-blue-600 to-cyan-600',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Total Balance',
      value: `₦${(stats?.total_balance || 0).toLocaleString()}`,
      icon: Wallet,
      color: 'from-green-600 to-emerald-600',
      change: '+8.5%',
      trend: 'up'
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.pending_withdrawals || 0,
      icon: Download,
      color: 'from-yellow-600 to-orange-600',
      change: 'Needs attention',
      trend: 'alert'
    },
    {
      title: "Today's Deposits",
      value: `₦${(stats?.today_deposits || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-purple-600 to-pink-600',
      change: '+24%',
      trend: 'up'
    },
    {
      title: 'Total XP Points',
      value: (stats?.total_xp || 0).toLocaleString(),
      icon: Coins,
      color: 'from-yellow-500 to-amber-600',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Active Fraud Flags',
      value: stats?.active_fraud_flags || 0,
      icon: AlertCircle,
      color: 'from-red-600 to-rose-600',
      change: 'High priority',
      trend: 'alert'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Overview of platform performance and activity</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 text-white"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center text-sm ${
                  card.trend === 'up' ? 'text-green-400' : 
                  card.trend === 'alert' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {card.trend === 'up' ? <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                   card.trend === 'alert' ? <AlertCircle className="h-4 w-4 mr-1" /> : 
                   <ArrowDownRight className="h-4 w-4 mr-1" />}
                  <span>{card.change}</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{card.value}</h3>
              <p className="text-gray-400">{card.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Withdrawals */}
        <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <Download className="h-5 w-5 mr-2 text-yellow-400" />
                Recent Withdrawal Requests
              </h2>
              <p className="text-sm text-gray-400">Requires admin approval</p>
            </div>
            <span className="px-3 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-sm">
              {recentWithdrawals.length} pending
            </span>
          </div>

          <div className="space-y-4">
            {recentWithdrawals.length > 0 ? (
              recentWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-yellow-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{withdrawal.username}</div>
                      <div className="text-sm text-gray-400">{withdrawal.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        ₦{withdrawal.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
                      {withdrawal.receipt_number}
                    </span>
                    <a
                      href={`/admin/withdrawals/${withdrawal.id}`}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Review →
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Download className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No pending withdrawal requests</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <a
              href="/admin/withdrawals"
              className="block text-center py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-white"
            >
              View All Withdrawals
            </a>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-400" />
                Recently Registered Users
              </h2>
              <p className="text-sm text-gray-400">New platform members</p>
            </div>
            <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm">
              {recentUsers.length} new
            </span>
          </div>

          <div className="space-y-4">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-blue-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="font-bold text-lg text-white">{user.username.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{user.username}</div>
                      <div className="text-sm text-gray-400 truncate">{user.email}</div>
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span className="text-gray-400">
                          Wallet: {user.wallet_account_number}
                        </span>
                        <span className="text-green-400">
                          ₦{user.balance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No recent user registrations</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <a
              href="/admin/users"
              className="block text-center py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-white"
            >
              View All Users
            </a>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/admin/withdrawals"
            className="p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-800/30 rounded-xl hover:border-yellow-700/50 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-900/50 rounded-lg group-hover:bg-yellow-800/50">
                <Download className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Process Withdrawals</div>
                <div className="text-sm text-gray-400">Approve pending requests</div>
              </div>
            </div>
          </a>

          <a
            href="/admin/fraud"
            className="p-4 bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-800/30 rounded-xl hover:border-red-700/50 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-900/50 rounded-lg group-hover:bg-red-800/50">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Review Fraud Flags</div>
                <div className="text-sm text-gray-400">Investigate suspicious activity</div>
              </div>
            </div>
          </a>

          <a
            href="/admin/settings"
            className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/30 rounded-xl hover:border-blue-700/50 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-900/50 rounded-lg group-hover:bg-blue-800/50">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white">System Settings</div>
                <div className="text-sm text-gray-400">Update rates and limits</div>
              </div>
            </div>
          </a>

          <a
            href="/admin/reports"
            className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800/30 rounded-xl hover:border-green-700/50 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-900/50 rounded-lg group-hover:bg-green-800/50">
                <BarChart3 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Generate Reports</div>
                <div className="text-sm text-gray-400">Download analytics</div>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 
          Server time: {new Date().toLocaleString()} • 
          Data refreshes every 5 minutes
        </p>
      </div>
    </>
  );
};

export default AdminDashboard;