// Authentication utility functions

// Get authentication token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('token'); // Change from 'authToken' to 'token'
};

// Set authentication token
export const setAuthToken = (token) => {
  localStorage.setItem('token', token); // Change from 'authToken' to 'token'
};

// Remove authentication token (logout)
export const removeAuthToken = () => {
  localStorage.removeItem('token'); // Change from 'authToken' to 'token'
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

// Get user data from localStorage
export const getUserData = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

// Set user data
export const setUserData = (userData) => {
  localStorage.setItem('userData', JSON.stringify(userData));
};

// Remove user data
export const removeUserData = () => {
  localStorage.removeItem('userData');
};

// Get authorization header for API requests
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};