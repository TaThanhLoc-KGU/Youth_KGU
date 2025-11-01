import api from './api';

const bchService = {
  // Get all BCH members
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/bch', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching BCH list:', error);
      return [];
    }
  },

  // Get BCH by ID
  getById: async (maBch) => {
    try {
      const response = await api.get(`/api/bch/${maBch}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching BCH:', error);
      return null;
    }
  },

  // Get BCH by email
  getByEmail: async (email) => {
    try {
      const response = await api.get(`/api/bch/email/${email}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching BCH by email:', error);
      return null;
    }
  },

  // Create new BCH member
  create: async (bchData) => {
    try {
      const response = await api.post('/api/bch', bchData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Update BCH member
  update: async (maBch, bchData) => {
    try {
      const response = await api.put(`/api/bch/${maBch}`, bchData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete BCH member (soft delete)
  delete: async (maBch) => {
    try {
      const response = await api.delete(`/api/bch/${maBch}`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Search by position (chức vụ)
  getByChucVu: async (chucVu) => {
    try {
      const response = await api.get(`/api/bch/chuc-vu/${chucVu}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching BCH by position:', error);
      return [];
    }
  },

  // Search by department (khoa)
  getByKhoa: async (maKhoa) => {
    try {
      const response = await api.get(`/api/bch/khoa/${maKhoa}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching BCH by department:', error);
      return [];
    }
  },

  // Simple keyword search
  search: async (keyword) => {
    try {
      const response = await api.get('/api/bch/search', {
        params: { keyword },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching BCH:', error);
      return [];
    }
  },

  // Advanced search with filters
  searchAdvanced: async (keyword, chucVu, maKhoa) => {
    try {
      const response = await api.get('/api/bch/search/advanced', {
        params: {
          keyword: keyword || undefined,
          chucVu: chucVu || undefined,
          maKhoa: maKhoa || undefined,
        },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error advanced searching BCH:', error);
      return [];
    }
  },

  // Get statistics by position
  getStatisticsByPosition: async () => {
    try {
      const response = await api.get('/api/bch/statistics/by-position');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching position statistics:', error);
      return {};
    }
  },

  // Get statistics by department
  getStatisticsByDepartment: async () => {
    try {
      const response = await api.get('/api/bch/statistics/by-department');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching department statistics:', error);
      return [];
    }
  },

  // Get total count
  getTotalCount: async () => {
    try {
      const response = await api.get('/api/bch/statistics/total');
      return response.data?.data || 0;
    } catch (error) {
      console.error('Error fetching total count:', error);
      return 0;
    }
  },
};

export default bchService;
