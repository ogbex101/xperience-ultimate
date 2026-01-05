// UNIVERSAL AUTH UTILITY - SINGLE SOURCE OF TRUTH
// Use this EVERYWHERE instead of localStorage directly

export const getToken = () => {
  // Check BOTH possible keys
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

export const setToken = (token) => {
  // Store in BOTH to prevent issues
  localStorage.setItem('token', token);
  localStorage.setItem('authToken', token);
  console.log('💾 Token stored in both locations');
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  console.log('🗑️ Tokens removed from both locations');
};

export const isAuthenticated = () => {
  return !!getToken();
};