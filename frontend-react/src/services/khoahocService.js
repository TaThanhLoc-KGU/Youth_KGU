import api from './api';

const khoahocService = {
  // Get all khoa hoc (courses/semesters)
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/khoahoc', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching khoahoc list:', error);
      return [];
    }
  },

  // Get khoahoc by ID
  getById: async (maKhoaHoc) => {
    try {
      const response = await api.get(`/api/khoahoc/${maKhoaHoc}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching khoahoc:', error);
      return null;
    }
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
    try {
      const response = await api.get('/api/khoahoc/search', {
        params: { keyword },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching khoahoc:', error);
      return [];
    }
  },

  // Get active khoahoc only
  getActive: async () => {
    try {
      const response = await api.get('/api/khoahoc/active');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching active khoahoc:', error);
      return [];
    }
  },

  // Get current semester
  getCurrent: async () => {
    try {
      const response = await api.get('/api/khoahoc/current');
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching current khoahoc:', error);
      return null;
    }
  },
};

export default khoahocService;
