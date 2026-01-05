import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Check, X, Users, Trophy, Gamepad2, 
  MessageSquare, Settings, ExternalLink, Sword,
  UserPlus, Wallet, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../utils/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 120000);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Get unread counts
      const countsResponse = await notificationsAPI.getNotificationCounts();
      if (countsResponse.success) {
        setUnreadCounts(countsResponse.data || {
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
      
      // Get recent notifications (max 10)
      const notificationsResponse = await notificationsAPI.getNotifications(null, null, 1, 10);
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (notification.status === 'unread') {
        await notificationsAPI.markAsRead(notification.id);
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, status: 'read' } 
              : n
          )
        );
        // Update counts
        setUnreadCounts(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          [notification.type]: Math.max(0, prev[notification.type] - 1)
        }));
      }
      
      // Handle navigation based on notification type
      if (notification.match_id) {
        navigate(`/matches/${notification.match_id}`);
      } else if (notification.tournament_id) {
        navigate(`/tournaments/${notification.tournament_id}`);
      } else if (notification.type === 'friend' && notification.sender_id) {
        navigate(`/profile/${notification.sender_id}`);
      } else if (notification.group_id) {
        navigate(`/groups/${notification.group_id}`);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleAcceptInvitation = async (notification, e) => {
    e.stopPropagation();
    try {
      const response = await notificationsAPI.acceptInvitation(notification.id);
      if (response.success) {
        // Update notification status
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, status: 'accepted' } 
              : n
          )
        );
        
        if (response.redirectUrl) {
          navigate(response.redirectUrl);
        }
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleRejectInvitation = async (notification, e) => {
    e.stopPropagation();
    try {
      const response = await notificationsAPI.rejectInvitation(notification.id);
      if (response.success) {
        // Update notification status
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, status: 'rejected' } 
              : n
          )
        );
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      const response = await notificationsAPI.markAllAsRead();
      if (response.success) {
        // Mark all as read locally
        setNotifications(prev => 
          prev.map(n => ({ ...n, status: 'read' }))
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
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'match': return Sword;
      case 'tournament': return Trophy;
      case 'friend': return UserPlus;
      case 'message': return MessageSquare;
      case 'transaction': return Wallet;
      case 'group': return Users;
      case 'system': return Settings;
      case 'invite': return Users;
      default: return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'match': return 'text-red-500';
      case 'tournament': return 'text-yellow-500';
      case 'friend': return 'text-blue-500';
      case 'message': return 'text-purple-500';
      case 'transaction': return 'text-green-500';
      case 'group': return 'text-pink-500';
      case 'system': return 'text-gray-500';
      case 'invite': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'accepted': return CheckCircle;
      case 'rejected': return X;
      case 'read': return Check;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'accepted': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      case 'read': return 'text-gray-400';
      default: return 'text-purple-400';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getNotificationTypeLabel = (type) => {
    switch(type) {
      case 'match': return 'Match';
      case 'tournament': return 'Tournament';
      case 'friend': return 'Friend';
      case 'message': return 'Message';
      case 'transaction': return 'Transaction';
      case 'group': return 'Group';
      case 'system': return 'System';
      case 'invite': return 'Invitation';
      default: return 'Notification';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCounts.total > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCounts.total > 9 ? '9+' : unreadCounts.total}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCounts.total > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 hover:bg-purple-500/10 rounded"
                    title="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                  className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 hover:bg-gray-800 rounded"
                >
                  View all
                </button>
              </div>
            </div>
            
            {/* Quick stats */}
            {unreadCounts.total > 0 && (
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Sword size={12} className="text-red-400" />
                  {unreadCounts.matches}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy size={12} className="text-yellow-400" />
                  {unreadCounts.tournaments}
                </span>
                <span className="flex items-center gap-1">
                  <UserPlus size={12} className="text-blue-400" />
                  {unreadCounts.friends}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} className="text-purple-400" />
                  {unreadCounts.chats}
                </span>
              </div>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400 mt-2 text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No notifications</p>
                <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const StatusIcon = getStatusIcon(notification.status);
                const colorClass = getNotificationColor(notification.type);
                const statusColor = getStatusColor(notification.status);
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-800 cursor-pointer transition-all hover:bg-gray-800/50 ${
                      notification.status === 'unread' 
                        ? 'bg-gradient-to-r from-gray-800/40 to-transparent border-l-2 border-purple-500' 
                        : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass} bg-opacity-10`}>
                        <Icon size={20} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate text-sm">
                              {notification.sender_username || 'System'}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${colorClass} bg-opacity-10`}>
                              {getNotificationTypeLabel(notification.type)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 ${statusColor}`}>
                              <StatusIcon size={12} />
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {/* Action Buttons */}
                        {notification.type === 'friend' && notification.status === 'unread' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => handleAcceptInvitation(notification, e)}
                              className="py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white text-xs rounded flex items-center justify-center gap-1 transition-colors"
                            >
                              <Check size={12} /> Accept
                            </button>
                            <button
                              onClick={(e) => handleRejectInvitation(notification, e)}
                              className="py-1.5 px-3 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded flex items-center justify-center gap-1 transition-colors"
                            >
                              <X size={12} /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-800 bg-gray-900/80">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full py-2.5 text-center text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                View All Notifications
                <ExternalLink size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;