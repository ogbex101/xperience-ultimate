import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getToken } from '../utils/universalAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const token = getToken();

  console.log('🔒 PROTECTED ROUTE:', {
    path: window.location.pathname,
    user: !!user,
    token: !!token,
    loading
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    console.log('❌ No token, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ Access granted');
  return children;
};

export default ProtectedRoute;