import axios from 'axios';
import { getAuthToken } from './auth';

const API_BASE_URL =import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const chatAPI = {
  getChatHistory: async (userId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/chat/history/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  sendMessage: async (messageData) => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`${API_BASE_URL}/chat/send`, 
        messageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  getConversations: async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { conversations: [] };
    }
  },

  getGroupConversations: async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/chat/group-conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching group conversations:', error);
      return { groups: [] };
    }
  },

  markMessagesAsRead: async (data) => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`${API_BASE_URL}/chat/mark-read`, 
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  getGroupChatHistory: async (groupId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/chat/group/${groupId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching group chat history:', error);
      throw error;
    }
  }
};

export default chatAPI;