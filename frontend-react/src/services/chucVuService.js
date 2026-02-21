import api from './api';

const chucVuService = {
  // Get all chuc vu
  getAll: async () => {
    try {
      const response = await api.get('/api/chuc-vu');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching chuc vu list:', error);
      throw error;
    }
  },

  // Get chuc vu by ID
  getById: async (maChucVu) => {
    try {
      const response = await api.get(`/api/chuc-vu/${maChucVu}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching chuc vu:', error);
      throw error;
    }
  },

  // Create new chuc vu
  create: async (data) => {
    try {
      const response = await api.post('/api/chuc-vu', data);
      return response.data?.data;
    } catch (error) {
      console.error('Error creating chuc vu:', error);
      throw error;
    }
  },

  // Update chuc vu
  update: async (maChucVu, data) => {
    try {
      const response = await api.put(`/api/chuc-vu/${maChucVu}`, data);
      return response.data?.data;
    } catch (error) {
      console.error('Error updating chuc vu:', error);
      throw error;
    }
  },

  // Delete chuc vu
  delete: async (maChucVu) => {
    try {
      const response = await api.delete(`/api/chuc-vu/${maChucVu}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error deleting chuc vu:', error);
      throw error;
    }
  },

  // Get chuc vu by type (thuoc ban)
  getByThuocBan: async (thuocBan) => {
    try {
      const response = await api.get(`/api/chuc-vu/thuoc-ban/${thuocBan}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching chuc vu by thuoc ban:', error);
      throw error;
    }
  },

  // Search chuc vu by keyword
  search: async (keyword) => {
    try {
      const response = await api.get('/api/chuc-vu/search', {
        params: { keyword },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching chuc vu:', error);
      throw error;
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      const response = await api.get('/api/chuc-vu/statistics');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching chuc vu statistics:', error);
      throw error;
    }
  },
};

export default chucVuService;
