import api from './api';

const nganhService = {
  // Get all majors
  getAll: async (params = {}) => {
    const response = await api.get('/api/nganh', { params });
    return response.data || [];
  },

  // Get nganh by ID
  getById: async (maNganh) => {
    const response = await api.get(`/api/nganh/${maNganh}`);
    return response.data?.data;
  },

  // Create new nganh
  create: async (nganhData) => {
    try {
      const response = await api.post('/api/nganh', nganhData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Update nganh
  update: async (maNganh, nganhData) => {
    try {
      const response = await api.put(`/api/nganh/${maNganh}`, nganhData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete nganh (soft delete)
  delete: async (maNganh) => {
    try {
      const response = await api.delete(`/api/nganh/${maNganh}`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Search/filter
  search: async (keyword) => {
    const response = await api.get('/api/nganh/search', {
      params: { keyword },
    });
    return response.data || [];
  },

  // Get by khoa
  getByKhoa: async (maKhoa) => {
    const response = await api.get(`/api/nganh/khoa/${maKhoa}`);
    return response.data || [];
  },

  // Get active nganh only
  getActive: async () => {
    const response = await api.get('/api/nganh/active');
    return response.data || [];
  },

  // Export to Excel
  exportToExcel: async (params = {}) => {
    try {
      const response = await api.get('/api/nganh/export/excel', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting nganh:', error);
      throw error;
    }
  },
};

export default nganhService;
