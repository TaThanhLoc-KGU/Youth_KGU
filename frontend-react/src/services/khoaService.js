import api from './api';

const khoaService = {
  // Get all faculties
  getAll: async (params = {}) => {
    const response = await api.get('/api/khoa', { params });
    return response.data || [];  },

  // Get khoa by ID
  getById: async (maKhoa) => {
    const response = await api.get(`/api/khoa/${maKhoa}`);
    return response.data?.data;
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
    const response = await api.get('/api/khoa/search', {
      params: { keyword },
    });
    return response.data || [];  },

  // Get active khoa only
  getActive: async () => {
    const response = await api.get('/api/khoa/active');
    return response.data || [];  },
};

export default khoaService;
