// friendsAPI.js - FIXED VERSION (no JSX)
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
    // Handle 401/403 errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Authentication error detected');
      localStorage.removeItem('authToken');
    }
    
    return Promise.reject(error);
  }
);

const friendsAPI = {
  getFriends: async () => {
    try {
      const response = await apiClient.get('/friends');
      return response.data;
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw error;
    }
  },

  getOnlineFriends: async () => {
    try {
      const response = await apiClient.get('/friends/online');
      return response.data;
    } catch (error) {
      console.error('Error fetching online friends:', error);
      throw error;
    }
  },

  getRequests: async () => {
    try {
      const response = await apiClient.get('/friends/requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      throw error;
    }
  },

  searchUsers: async (query) => {
    try {
      const response = await apiClient.get(`/friends/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  sendRequest: async (friendId) => {
    try {
      const response = await apiClient.post('/friends/send-request', { friendId });
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  acceptRequest: async (requestId) => {
    try {
      const response = await apiClient.post('/friends/accept-request', { requestId });
      return response.data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  },

  rejectRequest: async (requestId) => {
    try {
      const response = await apiClient.delete(`/friends/requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  },

  removeFriend: async (friendId) => {
    try {
      const response = await apiClient.delete(`/friends/${friendId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  },

  blockUser: async (friendId) => {
    try {
      const response = await apiClient.post('/friends/block', { friendId });
      return response.data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  updateStatus: async (statusData) => {
    try {
      const response = await apiClient.post('/friends/update-status', statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },

  addFavorite: async (friendId, isFavorite) => {
    try {
      const response = await apiClient.post('/friends/favorite', { 
        friendId, 
        isFavorite 
      });
      return response.data;
    } catch (error) {
      console.error('Error updating favorite:', error);
      throw error;
    }
  }
};

export default friendsAPI;