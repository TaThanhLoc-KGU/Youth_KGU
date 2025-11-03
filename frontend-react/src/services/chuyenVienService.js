import api from './api';

const chuyenVienService = {
  // Get all
  getAll: async () => {
    try {
      const response = await api.get('/api/chuyenvien');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching chuyen vien:', error);
      throw error;
    }
  },

  // Get by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/chuyenvien/${id}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching chuyen vien by id:', error);
      throw error;
    }
  },

  // Create
  create: async (data) => {
    try {
      const response = await api.post('/api/chuyenvien', data);
      return response.data?.data;
    } catch (error) {
      console.error('Error creating chuyen vien:', error);
      throw error;
    }
  },

  // Update
  update: async (id, data) => {
    try {
      const response = await api.put(`/api/chuyenvien/${id}`, data);
      return response.data?.data;
    } catch (error) {
      console.error('Error updating chuyen vien:', error);
      throw error;
    }
  },

  // Delete
  delete: async (id) => {
    try {
      await api.delete(`/api/chuyenvien/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting chuyen vien:', error);
      throw error;
    }
  },

  // Search
  search: async (keyword) => {
    try {
      const response = await api.get('/api/chuyenvien/search', {
        params: { keyword }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching chuyen vien:', error);
      throw error;
    }
  },

  // Get by khoa
  getByKhoa: async (maKhoa) => {
    try {
      const response = await api.get(`/api/chuyenvien/khoa/${maKhoa}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching chuyen vien by khoa:', error);
      throw error;
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      const response = await api.get('/api/chuyenvien/statistics');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching chuyen vien statistics:', error);
      throw error;
    }
  },
};

export default chuyenVienService;
