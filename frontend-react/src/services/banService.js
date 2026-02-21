import api from './api';

const banService = {
  // Get all ban
  getAll: async () => {
    try {
      const response = await api.get('/api/ban');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching ban list:', error);
      throw error;
    }
  },

  // Get ban by ID
  getById: async (maBan) => {
    try {
      const response = await api.get(`/api/ban/${maBan}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching ban:', error);
      throw error;
    }
  },

  // Create new ban
  create: async (data) => {
    try {
      const response = await api.post('/api/ban', data);
      return response.data?.data;
    } catch (error) {
      console.error('Error creating ban:', error);
      throw error;
    }
  },

  // Update ban
  update: async (maBan, data) => {
    try {
      const response = await api.put(`/api/ban/${maBan}`, data);
      return response.data?.data;
    } catch (error) {
      console.error('Error updating ban:', error);
      throw error;
    }
  },

  // Delete ban
  delete: async (maBan) => {
    try {
      const response = await api.delete(`/api/ban/${maBan}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error deleting ban:', error);
      throw error;
    }
  },

  // Get ban by type (loai ban)
  getByLoaiBan: async (loaiBan) => {
    try {
      const response = await api.get(`/api/ban/loai-ban/${loaiBan}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching ban by loai ban:', error);
      throw error;
    }
  },

  // Get ban by khoa
  getByKhoa: async (maKhoa) => {
    try {
      const response = await api.get(`/api/ban/khoa/${maKhoa}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching ban by khoa:', error);
      throw error;
    }
  },

  // Search ban by keyword
  search: async (keyword) => {
    try {
      const response = await api.get('/api/ban/search', {
        params: { keyword },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching ban:', error);
      throw error;
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      const response = await api.get('/api/ban/statistics');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching ban statistics:', error);
      throw error;
    }
  },
};

export default banService;
