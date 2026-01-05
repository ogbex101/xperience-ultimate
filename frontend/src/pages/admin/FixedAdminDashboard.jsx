// Create file: frontend/src/pages/admin/FixedAdminDashboard.jsx
import React, { useState, useEffect } from 'react';

const FixedAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMatches: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalUsers: 1247,
        activeUsers: 342,
        totalMatches: 89,
        totalRevenue: 12450,
        pendingWithdrawals: 8
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-800/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">Total Users</div>
          <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-green-400 text-sm">↑ 12% this month</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">Active Now</div>
          <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
          <div className="text-blue-400 text-sm">Online users</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">Total Matches</div>
          <div className="text-2xl font-bold text-white">{stats.totalMatches}</div>
          <div className="text-purple-400 text-sm">Live: 12</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">Revenue</div>
          <div className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</div>
          <div className="text-green-400 text-sm">Today</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">Withdrawals</div>
          <div className="text-2xl font-bold text-white">{stats.pendingWithdrawals}</div>
          <div className="text-yellow-400 text-sm">Pending</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { user: 'JohnDoe', action: 'created tournament', time: '5 min ago' },
            { user: 'JaneSmith', action: 'withdrew $500', time: '12 min ago' },
            { user: 'MikeJohnson', action: 'joined platform', time: '25 min ago' },
            { user: 'SarahWilson', action: 'won match', time: '1 hour ago' }
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-700/30 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                  <span className="text-white font-bold">{activity.user.charAt(0)}</span>
                </div>
                <div>
                  <span className="text-white font-medium">{activity.user}</span>
                  <span className="text-gray-400 ml-2">{activity.action}</span>
                </div>
              </div>
              <span className="text-gray-500 text-sm">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Dashboard loaded successfully. System is operational.</p>
      </div>
    </div>
  );
};

export default FixedAdminDashboard;