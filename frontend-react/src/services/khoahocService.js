import api from './api';

const khoahocService = {
  // Get all khoa hoc (courses/semesters)
  getAll: async (params = {}) => {
    const response = await api.get('/api/khoahoc', { params });
    return response.data?.data || [];
  },

  // Get khoahoc by ID
  getById: async (maKhoaHoc) => {
    const response = await api.get(`/api/khoahoc/${maKhoaHoc}`);
    return response.data?.data;
  },

  // Create new khoahoc
  create: async (khoahocData) => {
    try {
      const response = await api.post('/api/khoahoc', khoahocData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Update khoahoc
  update: async (maKhoaHoc, khoahocData) => {
    try {
      const response = await api.put(`/api/khoahoc/${maKhoaHoc}`, khoahocData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete khoahoc (soft delete)
  delete: async (maKhoaHoc) => {
    try {
      const response = await api.delete(`/api/khoahoc/${maKhoaHoc}`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Search/filter
  search: async (keyword) => {
    const response = await api.get('/api/khoahoc/search', {
      params: { keyword },
    });
    return response.data?.data || [];
  },

  // Get active khoahoc only
  getActive: async () => {
    const response = await api.get('/api/khoahoc/active');
    return response.data?.data || [];
  },

  // Get current semester
  getCurrent: async () => {
    const response = await api.get('/api/khoahoc/current');
    return response.data?.data;
  },
};

export default khoahocService;
