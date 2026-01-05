import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { useAuth } from './contexts/AuthContext' // Import useAuth
import { usersAPI } from './utils/api' // Import usersAPI

// Components
import Header from './components/common/Header.jsx'
import Footer from './components/common/Footer.jsx'

// Pages
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tournaments from './pages/Tournaments.jsx'
import TournamentDetails from './pages/TournamentDetails.jsx'
import CreateTournament from './pages/CreateTournament.jsx'
import CreateMatch from './pages/CreateMatch.jsx'
import MatchHistory from './pages/MatchHistory.jsx'
import MatchDetails from './pages/MatchDetails.jsx'
import Matches from './pages/Matches.jsx'
import FriendsPage from './pages/FriendsPage'
import GroupsPage from './pages/GroupsPage'
import ChatPage from './pages/ChatPage'
import GroupDetails from './pages/GroupDetails'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/admin/AdminRoute';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import WithdrawalQueue from './pages/admin/WithdrawalQueue';
import WithdrawalDetails from './pages/admin/WithdrawalDetails';
import UserManagement from './pages/admin/UserManagement';
import TransactionsManagement from './pages/admin/TransactionsManagement';
import MatchesManagement from './pages/admin/MatchesManagement';
import TournamentsManagement from './pages/admin/TournamentsManagement';
import SystemSettings from './pages/admin/SystemSettings';
import FraudDetection from './pages/admin/FraudDetection';
import GroupsManagement from './pages/admin/GroupsManagement';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import AdminManagement from './pages/admin/AdminManagement';
import NotificationsPage from './pages/NotificationsPage';

// ============ ADMIN LAYOUT ============
import AdminLayout from './components/admin/AdminLayout';

// ============ USER PAGES ============
import SettingsPage from './pages/SettingsPage';
import WalletPage from './pages/WalletPage'
import ProfilePage from './pages/ProfilePage'; // NEW IMPORT

// Simple Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg">
          <h3 className="text-xl font-bold text-red-400 mb-2">Component Failed to Load</h3>
          <p className="text-gray-300 mb-4">{this.state.error?.toString()}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============ LAST SEEN TRACKING COMPONENT ============
function LastSeenTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // Only track if user is logged in
    
    // Function to update last seen
    const updateLastSeen = async () => {
      try {
        await usersAPI.updateLastSeen();
        console.log('✅ Last seen updated for user:', user.username);
      } catch (error) {
        console.warn('⚠️ Failed to update last seen:', error.message);
        // Don't show error to user, it's not critical
      }
    };

    // Update immediately on component mount (page load)
    updateLastSeen();
    
    // Then update every 5 minutes (300,000ms) while user is active
    const intervalId = setInterval(updateLastSeen, 5 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(intervalId);
      console.log('🧹 Cleaned up last seen tracker');
    };
  }, [user]); // Re-run when user changes

  // This component doesn't render anything
  return null;
}

// ============ MAIN APP COMPONENT ============
function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        {/* LastSeenTracker runs in the background */}
        <LastSeenTracker />
        
        <div className="min-h-screen bg-black text-white">
          <Header />
          <main className="min-h-screen">
            <Routes>
              {/* ============ PUBLIC ROUTES ============ */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* ============ PROTECTED USER ROUTES ============ */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/tournaments" element={
                <ProtectedRoute>
                  <Tournaments />
                </ProtectedRoute>
              } />
              
              <Route path="/tournaments/create" element={
                <ProtectedRoute>
                  <CreateTournament />
                </ProtectedRoute>
              } />
              
              <Route path="/tournaments/:id" element={
                <ProtectedRoute>
                  <TournamentDetails />
                </ProtectedRoute>
              } />
              
              <Route path="/matches/create" element={
                <ProtectedRoute>
                  <CreateMatch />
                </ProtectedRoute>
              } />
              
              <Route path="/matches" element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              } />
              
              <Route path="/match-history" element={
                <ProtectedRoute>
                  <MatchHistory />
                </ProtectedRoute>
              } />
              
              <Route path="/matches/:matchId" element={
                <ProtectedRoute>
                  <MatchDetails />
                </ProtectedRoute>
              } />
              
              {/* Social Feature Routes */}
              <Route path="/friends" element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/groups" element={
                <ProtectedRoute>
                  <GroupsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/groups/:groupId" element={
                <ProtectedRoute>
                  <GroupDetails />
                </ProtectedRoute>
              } />
              
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              
              <Route path="/chat/:userId" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              
              {/* Wallet Route */}
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <WalletPage />
                </ProtectedRoute>
              } />
              
              {/* Profile Route - NEW */}
              <Route path="/profile/:id" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
			        <Route path="/notifications" element={<NotificationsPage />} />
              
              {/* ============ ADMIN ROUTES ============ */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin Debug Route */}
              <Route path="/admin/debug" element={
                <AdminRoute />
              } />

              {/* ============ MAIN ADMIN ROUTES ============ */}
              <Route path="/admin" element={<AdminRoute />}>
                {/* Redirect /admin to /admin/dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} />
                
                {/* Layout wrapper for ALL admin pages */}
                <Route element={<AdminLayout />}>
                  {/* TEST ROUTE - Simple page to verify layout works */}
                  <Route path="test" element={
                    <div className="p-6 bg-green-900/20 border border-green-500 rounded-xl">
                      <h1 className="text-2xl font-bold text-white">Admin Test Page</h1>
                      <p className="text-green-400 text-lg">✓ If you see this, AdminLayout + Outlet works!</p>
                      <p className="text-gray-300">The layout is correctly rendering nested routes</p>
                    </div>
                  } />
                  
                  {/* Dashboard */}
                  <Route path="dashboard" element={<AdminDashboard />} />
                  
                  {/* User Management */}
                  <Route path="users" element={<UserManagement />} />
                  
                  {/* Withdrawal Routes */}
                  <Route path="withdrawals" element={<WithdrawalQueue />} />
                  <Route path="withdrawals/:id" element={<WithdrawalDetails />} />
				          <Route path="transactions" element={<TransactionsManagement />} />
				          <Route path="matches-management" element={<MatchesManagement />} />
				          <Route path="tournaments-management" element={<TournamentsManagement />} />
				          <Route path="system-settings" element={<SystemSettings />} />
				          <Route path="fraud" element={<FraudDetection />} />
				          <Route path="groups-management" element={<GroupsManagement />} />
				          <Route path="reports" element={<ReportsAnalytics />} />
                  <Route path="admins" element={<AdminManagement />} />
                </Route>
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App