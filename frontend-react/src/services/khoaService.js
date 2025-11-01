import api from './api';

const khoaService = {
  // Get all faculties
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/khoa', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching khoa list:', error);
      return [];
    }
  },

  // Get khoa by ID
  getById: async (maKhoa) => {
    try {
      const response = await api.get(`/api/khoa/${maKhoa}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching khoa:', error);
      return null;
    }
  },

  // Create new khoa
  create: async (khoaData) => {
    try {
      const response = await api.post('/api/khoa', khoaData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Update khoa
  update: async (maKhoa, khoaData) => {
    try {
      const response = await api.put(`/api/khoa/${maKhoa}`, khoaData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete khoa (soft delete)
  delete: async (maKhoa) => {
    try {
      const response = await api.delete(`/api/khoa/${maKhoa}`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Search/filter
  search: async (keyword) => {
    try {
      const response = await api.get('/api/khoa/search', {
        params: { keyword },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching khoa:', error);
      return [];
    }
  },

  // Get active khoa only
  getActive: async () => {
    try {
      const response = await api.get('/api/khoa/active');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching active khoa:', error);
      return [];
    }
  },
};

export default khoaService;
