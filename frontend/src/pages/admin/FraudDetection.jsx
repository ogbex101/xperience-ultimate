import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, Shield, AlertTriangle,
  CheckCircle, XCircle, Clock, User, DollarSign,
  BarChart3, TrendingUp, AlertCircle, Users, Flag,
  RefreshCw, ShieldAlert, Activity
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const FraudDetection = () => {
  const [flags, setFlags] = useState([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuspiciousModal, setShowSuspiciousModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    confirmed: 0,
    falsePositive: 0,
    suspiciousUsers: 0,
    totalAmountAtRisk: 0
  });

  useEffect(() => {
    loadFlags();
    loadSuspiciousUsers();
    loadStats();
  }, [currentPage, filterStatus]);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getFraudFlags(filterStatus, currentPage, 20);
      setFlags(response.flags || response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error loading flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuspiciousUsers = async () => {
    try {
      const response = await adminAPI.getSuspiciousUsers();
      setSuspiciousUsers(response.users || response.data || []);
    } catch (error) {
      console.error('Error loading suspicious users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getFraudStats();
      if (response.stats) {
        setStats({
          total: response.stats.total || 0,
          pending: response.stats.pending || 0,
          reviewed: response.stats.reviewed || 0,
          confirmed: response.stats.confirmed || 0,
          falsePositive: response.stats.falsePositive || 0,
          suspiciousUsers: response.stats.suspiciousUsers || 0,
          totalAmountAtRisk: response.stats.totalAmountAtRisk || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadFlags();
  };

  const handleFlagAction = async (flagId, action, notes = '') => {
    try {
      const response = await adminAPI.updateFlagStatus(flagId, action, notes);
      if (response?.success) {
        loadFlags();
        loadStats();
      }
    } catch (error) {
      console.error('Error updating flag:', error);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      let response;
      switch (action) {
        case 'ban':
          response = await adminAPI.toggleUserBan(userId, true, 'Suspicious activity detected');
          break;
        case 'investigate':
          // Implement investigation logic
          break;
      }
      if (response?.success) {
        loadSuspiciousUsers();
      }
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  const FlagTypeBadge = ({ type }) => {
    const colors = {
      'multiple_accounts': 'bg-red-100 text-red-800',
      'chargeback': 'bg-orange-100 text-orange-800',
      'match_fixing': 'bg-purple-100 text-purple-800',
      'transaction_anomaly': 'bg-yellow-100 text-yellow-800',
      'login_anomaly': 'bg-blue-100 text-blue-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      'multiple_accounts': 'Multiple Accounts',
      'chargeback': 'Chargeback',
      'match_fixing': 'Match Fixing',
      'transaction_anomaly': 'Transaction Anomaly',
      'login_anomaly': 'Login Anomaly',
      'other': 'Other'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[type] || colors.other}`}>
        {labels[type] || type}
      </span>
    );
  };

  const RiskLevelBadge = ({ level }) => {
    const colors = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[level] || colors.medium}`}>
        {level?.toUpperCase()} Risk
      </span>
    );
  };

  const FlagStatusBadge = ({ status }) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'reviewed': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-red-100 text-red-800',
      'false_positive': 'bg-green-100 text-green-800'
    };
    
    const icons = {
      'pending': <Clock className="w-3 h-3 mr-1" />,
      'reviewed': <Eye className="w-3 h-3 mr-1" />,
      'confirmed': <AlertTriangle className="w-3 h-3 mr-1" />,
      'false_positive': <CheckCircle className="w-3 h-3 mr-1" />
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${colors[status] || colors.pending}`}>
        {icons[status]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Fraud Detection & Security</h1>
            <p className="text-gray-300">Monitor suspicious activity, review fraud flags, and protect the platform</p>
          </div>
          <button
            onClick={() => {
              loadFlags();
              loadSuspiciousUsers();
              loadStats();
            }}
            className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-red-500/10 to-red-600/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-500/20 mr-3">
              <Flag className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Pending Flags</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500/20 mr-3">
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Suspicious Users</p>
              <p className="text-2xl font-bold text-white">{stats.suspiciousUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500/10 to-red-600/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-500/20 mr-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Confirmed Fraud</p>
              <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/20 backdrop-blur-sm rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-500/20 mr-3">
              <DollarSign className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Amount at Risk</p>
              <p className="text-2xl font-bold text-white">
                ${stats.totalAmountAtRisk.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Fraud Flags Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Fraud Flags</h2>
                <div className="flex items-center space-x-2">
                  <select
                    className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="false_positive">False Positive</option>
                    <option value="">All Status</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Flag Details</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Risk</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400">
                        Loading flags...
                      </td>
                    </tr>
                  ) : flags.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400">
                        No flags found
                      </td>
                    </tr>
                  ) : (
                    flags.map((flag) => (
                      <tr key={flag.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-white">Flag #{flag.id}</div>
                          <FlagTypeBadge type={flag.type} />
                          <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                            {flag.description}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-white">User #{flag.user_id}</div>
                          <div className="text-xs text-gray-400">{flag.user?.username || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <RiskLevelBadge level={flag.risk_level} />
                        </td>
                        <td className="py-3 px-4">
                          <FlagStatusBadge status={flag.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedFlag(flag);
                                setShowDetailsModal(true);
                              }}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {flag.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleFlagAction(flag.id, 'confirmed', 'Confirmed as fraud')}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                  title="Confirm Fraud"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFlagAction(flag.id, 'false_positive', 'False positive')}
                                  className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                                  title="Mark as False Positive"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              </>
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
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suspicious Users Section */}
        <div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden h-full">
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Suspicious Users</h2>
                <button
                  onClick={() => setShowSuspiciousModal(true)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View All
                </button>
              </div>
            </div>

            <div className="p-4">
              {suspiciousUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShieldAlert className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                  <p>No suspicious users detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suspiciousUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-white">{user.username}</div>
                            <RiskLevelBadge level={user.risk_level} />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ID: {user.id} • Flags: {user.flag_count || 0}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleUserAction(user.id, 'investigate')}
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title="Investigate"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'ban')}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Ban User"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-300">
                        {user.reasons?.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="flex items-center mt-1">
                            <AlertCircle className="w-3 h-3 text-yellow-400 mr-1" />
                            {reason}
                          </div>
                        ))}
                        {user.reasons && user.reasons.length > 2 && (
                          <div className="text-gray-500 mt-1">+{user.reasons.length - 2} more reasons</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Fraud Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Flags</span>
                <span className="text-white font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">False Positives</span>
                <span className="text-green-400 font-medium">{stats.falsePositive}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Review Rate</span>
                <span className="text-blue-400 font-medium">
                  {stats.total > 0 ? Math.round((stats.reviewed / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Confirmation Rate</span>
                <span className="text-red-400 font-medium">
                  {stats.reviewed > 0 ? Math.round((stats.confirmed / stats.reviewed) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Fraud Prevention Activity</h3>
        <div className="space-y-3">
          {[
            { id: 1, action: 'Flag marked as confirmed fraud', user: 'User #8', time: '2 hours ago', type: 'fraud' },
            { id: 2, action: 'User banned for suspicious activity', user: '@destroyer', time: '4 hours ago', type: 'ban' },
            { id: 3, action: 'False positive flag dismissed', user: 'User #12', time: '6 hours ago', type: 'dismiss' },
            { id: 4, action: 'Multiple accounts detected', user: 'IP: 192.168.1.1', time: '1 day ago', type: 'detection' }
          ].map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${
                  activity.type === 'fraud' ? 'bg-red-500/20' :
                  activity.type === 'ban' ? 'bg-orange-500/20' :
                  activity.type === 'dismiss' ? 'bg-green-500/20' :
                  'bg-blue-500/20'
                }`}>
                  {activity.type === 'fraud' ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                   activity.type === 'ban' ? <Shield className="w-4 h-4 text-orange-400" /> :
                   activity.type === 'dismiss' ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                   <Activity className="w-4 h-4 text-blue-400" />}
                </div>
                <div>
                  <div className="text-white">{activity.action}</div>
                  <div className="text-sm text-gray-400">{activity.user} • {activity.time}</div>
                </div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Flag Details Modal */}
      {showDetailsModal && selectedFlag && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Fraud Flag Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Flag ID</label>
                    <div className="text-white">#{selectedFlag.id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Flag Type</label>
                    <FlagTypeBadge type={selectedFlag.type} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Risk Level</label>
                    <RiskLevelBadge level={selectedFlag.risk_level} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <FlagStatusBadge status={selectedFlag.status} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">User</label>
                    <div className="text-white">User #{selectedFlag.user_id}</div>
                    {selectedFlag.user && (
                      <div className="text-sm text-gray-400">
                        Username: {selectedFlag.user.username}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
                    <div className="text-white">
                      {new Date(selectedFlag.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Updated At</label>
                    <div className="text-white">
                      {new Date(selectedFlag.updated_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Severity Score</label>
                    <div className="text-white">
                      {selectedFlag.severity_score || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                <p className="text-gray-300">{selectedFlag.description}</p>
              </div>

              {selectedFlag.evidence && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">Evidence</h4>
                  <pre className="text-gray-300 text-sm bg-gray-800/50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedFlag.evidence, null, 2)}
                  </pre>
                </div>
              )}

              {selectedFlag.admin_notes && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">Admin Notes</h4>
                  <p className="text-gray-300">{selectedFlag.admin_notes}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedFlag.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleFlagAction(selectedFlag.id, 'confirmed', 'Confirmed as fraud after review');
                          setShowDetailsModal(false);
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 flex items-center justify-center"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Confirm as Fraud
                      </button>
                      <button
                        onClick={() => {
                          handleFlagAction(selectedFlag.id, 'false_positive', 'False positive - no fraud detected');
                          setShowDetailsModal(false);
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as False Positive
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-3 text-gray-300 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Suspicious Users Modal */}
      {showSuspiciousModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">All Suspicious Users</h3>
                <button
                  onClick={() => setShowSuspiciousModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Risk Level</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Flags</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Activity</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {suspiciousUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-white">{user.username}</div>
                          <div className="text-xs text-gray-400">ID: #{user.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <RiskLevelBadge level={user.risk_level} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white">{user.flag_count || 0}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {user.last_activity 
                            ? new Date(user.last_activity).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                // Navigate to user details
                                window.location.href = `/admin/users/${user.id}`;
                              }}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                              title="View User"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, 'ban')}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Ban User"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudDetection;