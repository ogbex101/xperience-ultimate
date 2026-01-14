import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Trophy,
  Swords,
  Users as UsersGroup,
  Settings,
  ShieldAlert,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  Wallet
} from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/admin/login';
    } catch (error) {
      console.error("❌ Logout error:", error);
      window.location.href = '/admin/login';
    }
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'User Management', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { name: 'Transactions', path: '/admin/transactions', icon: <CreditCard className="w-5 h-5" /> },
    { name: 'Matches', path: '/admin/matches', icon: <Swords className="w-5 h-5" /> },
    { name: 'Tournaments', path: '/admin/tournaments', icon: <Trophy className="w-5 h-5" /> },
    { name: 'System Settings', path: '/admin/system-settings', icon: <Settings className="w-5 h-5" /> },
    { name: 'Fraud Detection', path: '/admin/fraud', icon: <ShieldAlert className="w-5 h-5" /> },
    { name: 'Groups', path: '/admin/groups', icon: <UsersGroup className="w-5 h-5" /> },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Admin Management', path: '/admin/admins', icon: <Shield className="w-5 h-5" /> },
    { name: 'Withdrawal Queue', path: '/admin/withdrawals', icon: <Wallet className="w-5 h-5" /> },
    { name: 'Notifications', path: '/admin/notifications', icon: <Bell className="w-5 h-5" /> },
  ];

  const mainNav = navigationItems.slice(0, 9);
  const otherNav = navigationItems.slice(9);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-gray-800/80 backdrop-blur-sm text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - FIXED: lg:fixed for desktop, hidden/absolute for mobile */}
      <div className={`lg:fixed lg:inset-y-0 lg:left-0 z-30 w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Xperience Admin
              </h1>
              <p className="text-xs text-gray-400">Control Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="mb-8">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Main Navigation
            </h3>
            <nav className="space-y-1">
              {mainNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={`mr-3 ${
                    location.pathname === item.path 
                      ? 'text-blue-400' 
                      : 'text-gray-400 group-hover:text-blue-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                  {location.pathname === item.path && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mb-8">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Management
            </h3>
            <nav className="space-y-1">
              {otherNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={`mr-3 ${
                    location.pathname === item.path 
                      ? 'text-blue-400' 
                      : 'text-gray-400 group-hover:text-blue-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                  {location.pathname === item.path && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 px-3">
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
              <h4 className="text-sm font-semibold text-white mb-3">Quick Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Online Users</span>
                  <span className="text-xs font-medium text-green-400">247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Today's Revenue</span>
                  <span className="text-xs font-medium text-blue-400">$12,450</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Pending Withdrawals</span>
                  <span className="text-xs font-medium text-yellow-400">8</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Administrator</p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-500/10 to-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:from-red-600/20 hover:to-red-700/30 hover:text-red-300 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content - FIXED: Add ml-64 for desktop */}
      <div className="lg:ml-64">
        {/* Mobile Top Bar */}
        {!sidebarOpen && !mobileMenuOpen && (
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/50 z-20 px-4 flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-gray-800/80 backdrop-blur-sm text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="ml-4">
              <h1 className="text-lg font-bold text-white">Xperience Admin</h1>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className={`min-h-screen ${!sidebarOpen && !mobileMenuOpen ? 'pt-16' : 'pt-0'}`}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;