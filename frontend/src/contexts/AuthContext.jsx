// AuthContext.jsx - COMPLETE UPDATED VERSION
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { setToken, removeToken, getToken } from '../utils/universalAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState(getToken());

  useEffect(() => {
    console.log('🔵 AUTHCONTEXT: Mounted. Token exists?', !!token);
    
    if (token) {
      console.log('🔵 AUTHCONTEXT: Fetching profile with token');
      fetchUserProfile();
    } else {
      console.log('🔵 AUTHCONTEXT: No token found');
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      console.log('🔵 AUTHCONTEXT: Calling getProfile API');
      const data = await authAPI.getProfile();
      console.log('🔵 AUTHCONTEXT: Profile response:', data);
      
      // FIXED: Handle both API response formats
      let userData = null;
      
      if (data && data.success !== undefined) {
        // Format: { success: true, user: {...} }
        if (data.success && data.user) {
          userData = data.user;
          console.log('✅ AUTHCONTEXT: User loaded from success format');
        }
      } else if (data && data.user) {
        // Format: { user: {...} } 
        userData = data.user;
        console.log('✅ AUTHCONTEXT: User loaded from user format');
      } else if (data) {
        // Format: direct user object
        userData = data;
        console.log('✅ AUTHCONTEXT: User loaded from direct format');
      }
      
      if (userData) {
        setUser(userData);
        console.log('✅ AUTHCONTEXT: User profile loaded successfully');
      } else {
        console.warn('⚠️ AUTHCONTEXT: No user data found in response');
        // Token might be invalid, clear it
        removeToken();
        setTokenState(null);
      }
    } catch (error) {
      console.error('❌ AUTHCONTEXT: Profile fetch error:', error.message);
      // Clear invalid token
      removeToken();
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🔵 AUTHCONTEXT: Login attempt for:', email);
    try {
      const data = await authAPI.login({ email, password });
      console.log('🔵 AUTHCONTEXT: Login response:', data);

      // FIXED: Handle both response formats
      let authToken = null;
      let userData = null;
      
      if (data && data.accessToken) {
        authToken = data.accessToken;
        userData = data.user;
      } else if (data && data.token) {
        authToken = data.token;
        userData = data.user;
      } else if (data && data.data && data.data.accessToken) {
        authToken = data.data.accessToken;
        userData = data.data.user;
      } else if (data && data.data && data.data.token) {
        authToken = data.data.token;
        userData = data.data.user;
      }
      
      if (!authToken) {
        throw new Error('No token in response');
      }

      // Use universal setToken (stores in both places)
      setToken(authToken);
      setTokenState(authToken);
      setUser(userData);

      console.log('✅ AUTHCONTEXT: Login successful');
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ AUTHCONTEXT: Login error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('🔵 AUTHCONTEXT: Logging out');
    removeToken(); // Removes from both places
    setTokenState(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    token,
    login,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};