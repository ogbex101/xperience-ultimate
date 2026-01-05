import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, Users, Trash2, Shield,
  UserPlus, UserMinus, Settings, Globe, Lock,
  MessageSquare, Crown, Activity, TrendingUp
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const GroupsManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    totalMembers: 0,
    activeGroups: 0
  });

  useEffect(() => {
    loadGroups();
    loadStats();
  }, [currentPage, filterVisibility]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getGroups(searchTerm, currentPage, 20);
      setGroups(response.groups || response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      if (response.stats) {
        setStats({
          total: response.stats.totalGroups || 0,
          public: response.stats.publicGroups || 0,
          private: response.stats.privateGroups || 0,
          totalMembers: response.stats.totalGroupMembers || 0,
          activeGroups: response.stats.activeGroups || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMembers = async (groupId) => {
    try {
      const response = await adminAPI.getGroupMembers(groupId);
      setMembers(response.members || response.data || []);
      setShowMembersModal(true);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadGroups();
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group? All group data will be permanently removed.')) {
      try {
        const response = await adminAPI.deleteGroup(groupId, 'Deleted by admin');
        if (response?.success) {
          loadGroups();
          loadStats();
        }
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  };

  const handleRemoveMember = async (groupId, userId) => {
    if (window.confirm('Remove this member from the group?')) {
      try {
        const response = await adminAPI.removeGroupMember(groupId, userId);
        if (response?.success) {
          loadMembers(groupId);
        }
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const VisibilityBadge = ({ visibility }) => {
    const colors = {
      'public': 'bg-green-100 text-green-800',
      'private': 'bg-purple-100 text-purple-800'
    };
    
    const icons = {
      'public': <Globe className="w-3 h-3 mr-1" />,
      'private': <Lock className="w-3 h-3 mr-1" />
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${colors[visibility] || colors.public}`}>
        {icons[visibility]}
        {visibility}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Groups Management</h1>
        <p className="text-gray-300">Manage gaming groups, view members, and monitor group activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Groups</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/20 mr-3">
              <Globe className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Public Groups</p>
              <p className="text-2xl font-bold text-white">{stats.public}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
              <Lock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Private Groups</p>
              <p className="text-2xl font-bold text-white">{stats.private}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500/20 mr-3">
              <UserPlus className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Members</p>
              <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/20 mr-3">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Active Groups</p>
              <p className="text-2xl font-bold text-white">{stats.activeGroups}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search groups by name, game, or creator..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
              >
                <option value="">All Visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Groups Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Group Details</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Creator</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Members</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Visibility</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    Loading groups...
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No groups found
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-white">{group.name}</div>
                      <div className="text-xs text-gray-400">{group.game_specialty}</div>
                      {group.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {group.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-white">User #{group.creator_id}</div>
                      <div className="text-xs text-gray-400">
                        {group.creator?.username || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-white">
                          {group.current_members || 0}/{group.max_members || 20}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <VisibilityBadge visibility={group.visibility} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(group.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => loadMembers(group.id)}
                          className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="View Members"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Group Details Modal */}
      {showDetailsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{selectedGroup.name}</h3>
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
                    <label className="block text-sm font-medium text-gray-400 mb-1">Group ID</label>
                    <div className="text-white">#{selectedGroup.id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Game Specialty</label>
                    <div className="text-white">{selectedGroup.game_specialty}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Visibility</label>
                    <VisibilityBadge visibility={selectedGroup.visibility} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Max Members</label>
                    <div className="text-white">{selectedGroup.max_members || 20}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Creator</label>
                    <div className="text-white">User #{selectedGroup.creator_id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Current Members</label>
                    <div className="text-white">{selectedGroup.current_members || 0}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
                    <div className="text-white">
                      {new Date(selectedGroup.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Updated At</label>
                    <div className="text-white">
                      {new Date(selectedGroup.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {selectedGroup.description && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                  <p className="text-gray-300">{selectedGroup.description}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      loadMembers(selectedGroup.id);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700"
                  >
                    View Members
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(selectedGroup.id)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700"
                  >
                    Delete Group
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

      {/* Members Modal */}
      {showMembersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Members - {selectedGroup.name}
                </h3>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No members found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Member</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {members.map((member) => (
                        <tr key={member.user_id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <img
                                  className="h-8 w-8 rounded-full bg-gray-700"
                                  src={member.user?.profile_pic || 'https://via.placeholder.com/32'}
                                  alt={member.user?.username}
                                />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-white">
                                  {member.user?.username || `User #${member.user_id}`}
                                  {member.user_id === selectedGroup.creator_id && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded">
                                      Creator
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  ID: #{member.user_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              member.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {member.role || 'member'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">
                            {member.joined_at 
                              ? new Date(member.joined_at).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            {member.user_id !== selectedGroup.creator_id && (
                              <button
                                onClick={() => handleRemoveMember(selectedGroup.id, member.user_id)}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Remove Member"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsManagement;