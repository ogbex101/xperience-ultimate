import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    console.log('🔐 AdminRoute: Checking authentication...');
    
    // Check if adminToken exists in localStorage
    const adminToken = localStorage.getItem('adminToken');
    
    console.log('🔐 AdminRoute: adminToken:', adminToken ? 'Present' : 'Missing');
    
    // Simple check - if token exists, allow access
    // TODO: Add proper JWT verification later
    if (adminToken) {
      console.log('✅ AdminRoute: Token found, allowing access');
      setIsAuthenticated(true);
    } else {
      console.log('❌ AdminRoute: No token found, redirecting to login');
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔐 AdminRoute: Redirecting to /admin/login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  console.log('✅ AdminRoute: Rendering children via Outlet');
  return <Outlet />;
};

export default AdminRoute;