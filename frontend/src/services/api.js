import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const createMatch = async (matchData) => {
  const response = await api.post('/matches', matchData);
  return response.data;
};

export const searchUsers = async (username) => {
  const response = await api.get(`/users/search?username=${username}`);
  return response.data;
};

export const getOpenMatches = async () => {
  const response = await api.get('/matches/open');
  return response.data;
};

export const joinMatch = async (matchId) => {
  const response = await api.post(`/matches/${matchId}/join`);
  return response.data;
};

export const getMatchDetails = async (matchId) => {
  const response = await api.get(`/matches/${matchId}`);
  return response.data;
};

// TOURNAMENT API FUNCTIONS - ADD THESE
export const tournamentsAPI = {
  // Create new tournament
  create: async (tournamentData) => {
    const response = await api.post('/tournaments', tournamentData);
    return response;
  },

  // Get all tournaments
  getAll: async () => {
    const response = await api.get('/tournaments');
    return response.data;
  },

  // Get tournament by ID
  getById: async (tournamentId) => {
    const response = await api.get(`/tournaments/${tournamentId}`);
    return response.data;
  },

  // Join tournament
  join: async (tournamentId) => {
    const response = await api.post(`/tournaments/${tournamentId}/join`);
    return response.data;
  },

  // Get user's tournaments
  getMyTournaments: async () => {
    const response = await api.get('/tournaments/my-tournaments');
    return response.data;
  }
};

// Default export
export default api;