// components/FriendRequests.jsx
import React, { useState } from 'react';
import { 
  UserCheck, UserX, Clock, Check, X, User, Trophy,
  Calendar, Shield, MoreVertical, ExternalLink, MessageSquare
} from 'lucide-react';

const FriendRequests = ({ 
  requests, 
  onRequestAccepted, 
  onRequestRejected, 
  onUpdate 
}) => {
  const [loading, setLoading] = useState({});

  const handleAccept = async (requestId, username) => {
    if (loading[requestId]) return;
    
    setLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      if (onRequestAccepted) {
        await onRequestAccepted(requestId, username);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId, username) => {
    if (loading[requestId]) return;
    
    setLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      if (onRequestRejected) {
        await onRequestRejected(requestId, username);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gray-800 flex items-center justify-center">
          <UserCheck className="w-12 h-12 text-gray-600" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No pending requests</h3>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Friend requests will appear here when other players want to connect with you.
        </p>
        <div className="p-4 bg-gray-800/50 rounded-xl max-w-md mx-auto">
          <p className="text-sm text-gray-400">
            When you receive a friend request, you can:
          </p>
          <ul className="mt-2 space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Accept to add them as a friend</span>
            </li>
            <li className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-400" />
              <span>Decline to ignore the request</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Friend Requests ({requests.length})</h3>
            <p className="text-gray-400">Players who want to connect with you</p>
          </div>
          {onUpdate && (
            <button
              onClick={onUpdate}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div 
            key={request.request_id || request.id} 
            className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 hover:border-yellow-500/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
                    {request.profile_pic && request.profile_pic !== 'default.png' ? (
                      <img 
                        src={`/uploads/${request.profile_pic}`} 
                        alt={request.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-600 to-orange-600">
                        <span className="text-white font-bold text-xl">
                          {request.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-900 bg-yellow-500 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{request.username}</h3>
                    {request.rank && (
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getRankColor(request.rank)}`}>
                        {request.rank}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-gray-400">
                      Sent {formatTime(request.created_at)}
                    </span>
                    {request.win_rate > 0 && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span className="text-green-400">
                          {request.win_rate}% WR
                        </span>
                      </>
                    )}
                  </div>
                  {request.wins !== undefined && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{request.wins || 0}W - {request.losses || 0}L</span>
                      <span>•</span>
                      <span>{request.matches_played || 0} matches</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleAccept(request.request_id || request.id, request.username)}
                  disabled={loading[request.request_id || request.id]}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
                >
                  {loading[request.request_id || request.id] ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Accept</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleReject(request.request_id || request.id, request.username)}
                  disabled={loading[request.request_id || request.id]}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-lg font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
                >
                  <X className="w-4 h-4" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                  <div className="text-lg font-bold text-white">{request.wins || 0}</div>
                  <div className="text-xs text-gray-400">Wins</div>
                </div>
                <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                  <div className="text-lg font-bold text-white">{request.losses || 0}</div>
                  <div className="text-xs text-gray-400">Losses</div>
                </div>
                <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                  <div className="text-lg font-bold text-white">{request.matches_played || 0}</div>
                  <div className="text-xs text-gray-400">Matches</div>
                </div>
                <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-400">{request.win_rate || 0}%</div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
        <h4 className="text-sm font-medium text-white mb-2">About Friend Requests</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span><span className="text-white">Accept</span> - Add the player to your friends list. You'll be able to chat and see their online status.</span>
          </li>
          <li className="flex items-start gap-2">
            <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <span><span className="text-white">Decline</span> - The player won't be notified, and the request will be removed.</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span>Pending requests expire after 30 days if not responded to.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FriendRequests;