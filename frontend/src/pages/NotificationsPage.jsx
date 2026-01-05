import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  X, 
  Users, 
  Trophy, 
  Gamepad2, 
  MessageSquare, 
  Settings, 
  ExternalLink,
  Trash2,
  CheckCircle,
  Clock,
  Trash,
  RefreshCw,
  AlertCircle,
  Sword,
  Wallet,
  UserPlus,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI } from '../utils/api';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [unreadCounts, setUnreadCounts] = useState({
    total: 0,
    matches: 0,
    tournaments: 0,
    friends: 0,
    chats: 0,
    transactions: 0,
    groups: 0,
    system: 0
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  const tabs = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'match', label: 'Matches', icon: Sword },
    { id: 'tournament', label: 'Tournaments', icon: Trophy },
    { id: 'friend', label: 'Friends', icon: UserPlus },
    { id: 'chat', label: 'Chats', icon: MessageSquare },
    { id: 'transaction', label: 'Transactions', icon: Wallet },
    { id: 'group', label: 'Groups', icon: Users },
    { id: 'system', label: 'System', icon: Settings }
  ];

  // Fetch data
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📱 Fetching notifications with params:', {
        type: activeTab === 'all' ? null : activeTab,
        page: pagination.page,
        limit: pagination.limit
      });
      
      const response = await notificationsAPI.getNotifications(
        activeTab === 'all' ? null : activeTab,
        null,
        pagination.page,
        pagination.limit
      );
      
      console.log('📱 API Response:', response);
      
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1
        });
        
        if (response.data.unreadCounts) {
          setUnreadCounts(response.data.unreadCounts);
        }
      } else {
        setError(response.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
      setError(err.message || 'Network error');
      
      // Debug: Try to see what's in the database
      try {
        const debugResponse = await notificationsAPI.debugAll();
        console.log('🔍 Debug API Response:', debugResponse);
      } catch (debugErr) {
        console.error('Debug failed:', debugErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await notificationsAPI.getNotificationCounts();
      if (response.success) {
        setUnreadCounts(response.data || {
          total: 0,
          matches: 0,
          tournaments: 0,
          friends: 0,
          chats: 0,
          transactions: 0,
          groups: 0,
          system: 0
        });
      }
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchCounts();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchCounts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeTab, pagination.page]);

  // Handler functions
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'read' } 
              : notif
          )
        );
        
        // Update counts
        fetchCounts();
      }
    } catch (err) {
      console.error('Error marking as read:', err);
      alert('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!window.confirm('Mark all notifications as read?')) return;
    
    try {
      const response = await notificationsAPI.markAllAsRead();
      if (response.success) {
        // Update all notifications to read
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, status: 'read' }))
        );
        
        // Reset counts
        setUnreadCounts({
          total: 0,
          matches: 0,
          tournaments: 0,
          friends: 0,
          chats: 0,
          transactions: 0,
          groups: 0,
          system: 0
        });
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      alert('Failed to mark all as read');
    }
  };

  const handleAcceptInvitation = async (notificationId) => {
    try {
      const response = await notificationsAPI.acceptInvitation(notificationId);
      if (response.success) {
        // Update notification status
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'accepted' } 
              : notif
          )
        );
        
        // Navigate if redirectUrl provided
        if (response.redirectUrl) {
          navigate(response.redirectUrl);
        }
        
        fetchCounts();
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert('Failed to accept invitation');
    }
  };

  const handleRejectInvitation = async (notificationId) => {
    if (!window.confirm('Reject this invitation?')) return;
    
    try {
      const response = await notificationsAPI.rejectInvitation(notificationId);
      if (response.success) {
        // Update notification status
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'rejected' } 
              : notif
          )
        );
        
        fetchCounts();
      }
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      alert('Failed to reject invitation');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;
    
    try {
      const response = await notificationsAPI.deleteNotification(notificationId);
      if (response.success) {
        // Remove from local state
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
        
        fetchCounts();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL notifications? This cannot be undone.')) return;
    
    try {
      const response = await notificationsAPI.clearAll();
      if (response.success) {
        setNotifications([]);
        setUnreadCounts({
          total: 0,
          matches: 0,
          tournaments: 0,
          friends: 0,
          chats: 0,
          transactions: 0,
          groups: 0,
          system: 0
        });
      }
    } catch (err) {
      console.error('Error clearing all:', err);
      alert('Failed to clear notifications');
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchNotifications(), fetchCounts()]);
  };

  const handleCreateTestNotification = async () => {
    try {
      const message = `Test notification from ${user?.username || 'System'} at ${new Date().toLocaleTimeString()}`;
      const response = await notificationsAPI.createTestNotification(message, 'system');
      if (response.success) {
        alert('Test notification created!');
        fetchNotifications();
        fetchCounts();
      }
    } catch (err) {
      console.error('Error creating test notification:', err);
      alert('Failed to create test notification');
    }
  };

  // Helper functions
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'match': return Sword;
      case 'tournament': return Trophy;
      case 'friend': return UserPlus;
      case 'chat': return MessageSquare;
      case 'transaction': return Wallet;
      case 'group': return Users;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'match': return '#EF4444'; // red-500
      case 'tournament': return '#F59E0B'; // amber-500
      case 'friend': return '#3B82F6'; // blue-500
      case 'chat': return '#8B5CF6'; // violet-500
      case 'transaction': return '#10B981'; // emerald-500
      case 'group': return '#EC4899'; // pink-500
      case 'system': return '#6B7280'; // gray-500
      default: return '#6366F1'; // indigo-500
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'accepted': return CheckCircle;
      case 'rejected': return X;
      case 'read': return Check;
      default: return Clock; // unread
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'accepted': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      case 'read': return 'text-gray-400';
      default: return 'text-purple-400'; // unread
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getUnreadCountForTab = (tabId) => {
    if (tabId === 'all') return unreadCounts.total || 0;
    return unreadCounts[tabId] || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Bell className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                <p className="text-gray-400">
                  {unreadCounts.total > 0 
                    ? `${unreadCounts.total} unread notification${unreadCounts.total !== 1 ? 's' : ''}`
                    : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCounts.total === 0}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  unreadCounts.total > 0
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Check size={16} />
                Mark All Read
              </button>
              
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Trash size={16} />
                Clear All
              </button>
            </div>
          </div>

          {/* Debug button - remove in production */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleCreateTestNotification}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <AlertCircle size={14} />
              Create Test Notification
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const unreadCount = getUnreadCountForTab(tab.id);
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {unreadCount > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400" size={20} />
              <div>
                <p className="text-red-300 font-medium">Error loading notifications</p>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No notifications</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {activeTab === 'all' 
                  ? "You're all caught up! Check back later for new notifications."
                  : `No ${activeTab} notifications found.`}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRefresh}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                <button
                  onClick={handleCreateTestNotification}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                >
                  Create Test Notification
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const StatusIcon = getStatusIcon(notification.status);
                const color = getNotificationColor(notification.type);
                const statusColor = getStatusColor(notification.status);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-6 transition-all hover:bg-gray-800/50 ${
                      notification.status === 'unread' 
                        ? 'bg-gradient-to-r from-gray-800/30 via-gray-800/20 to-transparent border-l-4 border-purple-500'
                        : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon size={24} style={{ color }} />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">
                              {notification.sender_username || 'System'}
                            </span>
                            
                            <span 
                              className="px-2 py-1 text-xs font-bold rounded-full"
                              style={{ 
                                backgroundColor: `${color}20`,
                                color
                              }}
                            >
                              {notification.type.toUpperCase()}
                            </span>
                            
                            <div className={`flex items-center gap-1 text-xs ${statusColor}`}>
                              <StatusIcon size={12} />
                              <span className="capitalize">{notification.status}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">
                              {formatDate(notification.created_at)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              {notification.status === 'unread' && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-xs text-gray-400 hover:text-white transition-colors"
                                  title="Mark as read"
                                >
                                  Mark read
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Message */}
                        <p className="text-gray-200 mb-4">{notification.message}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mt-4">
                          {notification.type === 'friend' && notification.status === 'unread' && (
                            <>
                              <button
                                onClick={() => handleAcceptInvitation(notification.id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                              >
                                <Check size={14} />
                                Accept Friend Request
                              </button>
                              <button
                                onClick={() => handleRejectInvitation(notification.id)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                              >
                                <X size={14} />
                                Decline
                              </button>
                            </>
                          )}
                          
                          {notification.match_id && (
                            <button
                              onClick={() => navigate(`/matches/${notification.match_id}`)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                              <Gamepad2 size={14} />
                              View Match
                            </button>
                          )}
                          
                          {notification.tournament_id && (
                            <button
                              onClick={() => navigate(`/tournaments/${notification.tournament_id}`)}
                              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                              <Trophy size={14} />
                              View Tournament
                            </button>
                          )}
                          
                          {notification.group_id && (
                            <button
                              onClick={() => navigate(`/groups/${notification.group_id}`)}
                              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                              <Users size={14} />
                              View Group
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-800 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.totalPages} •{' '}
                {pagination.total} total notifications
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    pagination.page === 1
                      ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    pagination.page >= pagination.totalPages
                      ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Footer */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {tabs.map(tab => (
            <div key={tab.id} className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {getUnreadCountForTab(tab.id)}
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {tab.label} {tab.id === 'all' ? '' : 'Unread'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;