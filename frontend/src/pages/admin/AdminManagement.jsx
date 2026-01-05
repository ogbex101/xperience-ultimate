import React, { useState, useEffect } from 'react';
import {
  Search, Shield, UserPlus, Edit, Trash2,
  Eye, CheckCircle, XCircle, Lock, Unlock,
  Users, Crown, Activity, Key, AlertCircle,
  Filter, RefreshCw
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [adminLogs, setAdminLogs] = useState([]);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: []
  });
  const [permissions, setPermissions] = useState({});
  const [availablePermissions] = useState([
    { id: 'view_dashboard', label: 'View Dashboard', category: 'general' },
    { id: 'manage_users', label: 'Manage Users', category: 'users' },
    { id: 'manage_admins', label: 'Manage Admins', category: 'system' },
    { id: 'approve_withdrawals', label: 'Approve Withdrawals', category: 'financial' },
    { id: 'view_transactions', label: 'View Transactions', category: 'financial' },
    { id: 'manage_matches', label: 'Manage Matches', category: 'games' },
    { id: 'manage_tournaments', label: 'Manage Tournaments', category: 'games' },
    { id: 'manage_groups', label: 'Manage Groups', category: 'community' },
    { id: 'view_fraud_flags', label: 'View Fraud Flags', category: 'security' },
    { id: 'manage_settings', label: 'Manage Settings', category: 'system' },
    { id: 'view_reports', label: 'View Reports', category: 'analytics' },
    { id: 'manage_xp_rates', label: 'Manage XP Rates', category: 'system' }
  ]);

  useEffect(() => {
    loadAdmins();
    loadAdminLogs();
  }, [currentPage, filterRole]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdmins();
      setAdmins(response.admins || response.data || []);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminLogs = async () => {
    try {
      const response = await adminAPI.getAdminLogs();
      setAdminLogs(response.logs || response.data || []);
    } catch (error) {
      console.error('Error loading admin logs:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAdmins();
  };

  const handleCreateAdmin = async () => {
    try {
      const response = await adminAPI.createAdmin(newAdmin);
      if (response?.success) {
        setShowCreateModal(false);
        setNewAdmin({
          username: '',
          email: '',
          password: '',
          role: 'admin',
          permissions: []
        });
        loadAdmins();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      const response = await adminAPI.updateAdminPermissions(
        selectedAdmin.id,
        Object.keys(permissions).filter(key => permissions[key])
      );
      if (response?.success) {
        setShowPermissionsModal(false);
        setPermissions({});
        loadAdmins();
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      try {
        const response = await adminAPI.deleteAdmin(adminId);
        if (response?.success) {
          loadAdmins();
        }
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  const handleTogglePermission = (permissionId) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const RoleBadge = ({ role }) => {
    const colors = {
      'super_admin': 'bg-red-100 text-red-800',
      'admin': 'bg-blue-100 text-blue-800',
      'moderator': 'bg-green-100 text-green-800',
      'support': 'bg-purple-100 text-purple-800'
    };
    
    const icons = {
      'super_admin': <Crown className="w-3 h-3 mr-1" />,
      'admin': <Shield className="w-3 h-3 mr-1" />,
      'moderator': <Users className="w-3 h-3 mr-1" />,
      'support': <Activity className="w-3 h-3 mr-1" />
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${colors[role] || colors.admin}`}>
        {icons[role]}
        {role.replace('_', ' ')}
      </span>
    );
  };

  const StatusBadge = ({ active }) => {
    return active ? (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Management</h1>
            <p className="text-gray-300">Manage administrator accounts, permissions, and access levels</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </button>
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
                placeholder="Search admins by username or email..."
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
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="support">Support</option>
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

      {/* Admins Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Admin</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Active</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Permissions</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    Loading admins...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No admins found
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold">{admin.username.charAt(0)}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{admin.username}</div>
                          <div className="text-sm text-gray-400">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <RoleBadge role={admin.role} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge active={admin.is_active} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {admin.last_login 
                        ? new Date(admin.last_login).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-gray-400">
                        {admin.permissions?.length || 0} permissions
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin);
                            // Initialize permissions for this admin
                            const adminPerms = {};
                            admin.permissions?.forEach(perm => {
                              adminPerms[perm] = true;
                            });
                            setPermissions(adminPerms);
                            setShowPermissionsModal(true);
                          }}
                          className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                          title="Edit Permissions"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        
                        {admin.role !== 'super_admin' && (
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete Admin"
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
      </div>

      {/* Admin Activity Logs */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Recent Admin Activity</h3>
            <button
              onClick={loadAdminLogs}
              className="p-2 text-gray-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {adminLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p>No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      log.action_type === 'login' ? 'bg-green-500/20' :
                      log.action_type === 'modify' ? 'bg-blue-500/20' :
                      log.action_type === 'delete' ? 'bg-red-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      {log.action_type === 'login' ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                       log.action_type === 'modify' ? <Edit className="w-4 h-4 text-blue-400" /> :
                       log.action_type === 'delete' ? <Trash2 className="w-4 h-4 text-red-400" /> :
                       <Activity className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div>
                      <div className="text-white">
                        <span className="font-medium">{log.admin?.username || 'Admin'}</span> • {log.action}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(log.created_at).toLocaleString()} • IP: {log.ip_address}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {log.details}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Details Modal */}
      {showDetailsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Admin Details</h3>
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
                    <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                    <div className="text-white">{selectedAdmin.username}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <div className="text-white">{selectedAdmin.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                    <RoleBadge role={selectedAdmin.role} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <StatusBadge active={selectedAdmin.is_active} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
                    <div className="text-white">
                      {new Date(selectedAdmin.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Last Login</label>
                    <div className="text-white">
                      {selectedAdmin.last_login 
                        ? new Date(selectedAdmin.last_login).toLocaleString()
                        : 'Never'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Last IP</label>
                    <div className="text-white">
                      {selectedAdmin.last_ip || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Total Logins</label>
                    <div className="text-white">
                      {selectedAdmin.login_count || 0}
                    </div>
                  </div>
                </div>
              </div>

              {selectedAdmin.permissions && selectedAdmin.permissions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-4">Permissions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedAdmin.permissions.map((permission, index) => (
                      <div key={index} className="bg-gray-800/30 rounded-lg p-3">
                        <div className="text-sm text-white">{permission}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      const adminPerms = {};
                      selectedAdmin.permissions?.forEach(perm => {
                        adminPerms[perm] = true;
                      });
                      setPermissions(adminPerms);
                      setShowPermissionsModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700"
                  >
                    Edit Permissions
                  </button>
                  {selectedAdmin.role !== 'super_admin' && (
                    <button
                      onClick={() => {
                        handleDeleteAdmin(selectedAdmin.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700"
                    >
                      Delete Admin
                    </button>
                  )}
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

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Create New Admin</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                    placeholder="Enter username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    placeholder="Enter email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    placeholder="Enter password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Role
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                  >
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="support">Support</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAdmin}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700"
                >
                  Create Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Edit Permissions - {selectedAdmin.username}
                </h3>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Select the permissions for this admin. Super admins have all permissions by default.
                </p>
              </div>

              <div className="space-y-6">
                {['general', 'users', 'financial', 'games', 'community', 'security', 'system', 'analytics'].map((category) => {
                  const categoryPermissions = availablePermissions.filter(p => p.category === category);
                  if (categoryPermissions.length === 0) return null;
                  
                  return (
                    <div key={category} className="border border-gray-700/50 rounded-lg overflow-hidden">
                      <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700/50">
                        <h4 className="font-semibold text-white capitalize">{category} Permissions</h4>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={permission.id}
                                checked={permissions[permission.id] || false}
                                onChange={() => handleTogglePermission(permission.id)}
                                className="mr-3 h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                              />
                              <label htmlFor={permission.id} className="text-sm text-gray-300">
                                {permission.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePermissions}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700"
                  >
                    Save Permissions
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

export default AdminManagement;