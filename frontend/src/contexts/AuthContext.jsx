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
      
      if (data.success) {
        setUser(data.user);
        console.log('✅ AUTHCONTEXT: User profile loaded');
      } else {
        console.warn('⚠️ AUTHCONTEXT: Profile fetch returned false');
      }
    } catch (error) {
      console.error('❌ AUTHCONTEXT: Profile fetch error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🔵 AUTHCONTEXT: Login attempt for:', email);
    try {
      const data = await authAPI.login({ email, password });
      console.log('🔵 AUTHCONTEXT: Login response:', data);

      const authToken = data.accessToken || data.token;
      if (!authToken) throw new Error('No token in response');

      // Use universal setToken (stores in both places)
      setToken(authToken);
      setTokenState(authToken);
      setUser(data.user);

      console.log('✅ AUTHCONTEXT: Login successful');
      return { success: true, user: data.user };
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