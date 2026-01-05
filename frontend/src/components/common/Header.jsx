import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import NotificationBell from "../../components/NotificationBell";
import { 
  Gamepad2, 
  Trophy, 
  Users, 
  Wallet, 
  LogOut, 
  User, 
  History, 
  MessageSquare, 
  Bell,
  Shield,
  Home
} from 'lucide-react'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { unreadMessages } = useSocket()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/match-history', label: 'Matches', icon: History },
    { path: '/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/groups', label: 'Groups', icon: Users },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/settings', label: 'Settings', icon: Shield },
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-purple-gradient rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">XP</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              // Check for notification badges
              let badgeCount = 0
              if (item.path === '/chat' && unreadMessages > 0) {
                badgeCount = unreadMessages
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 relative ${
                    isActive
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  
                  {/* Notification Badge */}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
            
            {/* Friends Link (separate with notification) */}
            <Link
              to="/friends"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 text-gray-300 hover:bg-gray-800 hover:text-white relative"
            >
              <Users className="w-4 h-4" />
              <span>Friends</span>
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notification Bell Component */}
                <NotificationBell />
                
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-white font-semibold">{user ? user.username : 'Guest'}</p>
                    <p className="text-gray-400 text-sm">
                      Rank: <span className="text-purple-400">{user ? user.rank : 'E'}</span> • 
                      Balance: <span className="text-green-400">₦{user ? user.balance : '0.00'}</span>
                    </p>
                  </div>
                  
                  {/* Updated Profile Link */}
                  <Link
                    to={`/profile/${user?.id}`}
                    className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all duration-300"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:block">Profile</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:block">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="btn-secondary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header