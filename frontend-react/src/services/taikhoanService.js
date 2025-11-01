import api from './api';

const taikhoanService = {
  // Get all accounts
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/taikhoan', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  },

  // Get account by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/taikhoan/${id}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching account:', error);
      return null;
    }
  },

  // Get account by username
  getByUsername: async (username) => {
    try {
      const response = await api.get(`/api/taikhoan/username/${username}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching account by username:', error);
      return null;
    }
  },

  // Create new account
  create: async (accountData) => {
    try {
      const response = await api.post('/api/taikhoan', accountData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Update account
  update: async (id, accountData) => {
    try {
      const response = await api.put(`/api/taikhoan/${id}`, accountData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete account
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/taikhoan/${id}`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (id) => {
    try {
      const response = await api.post(`/api/taikhoan/${id}/reset-password`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Toggle account status
  toggleStatus: async (id) => {
    try {
      const response = await api.post(`/api/taikhoan/${id}/toggle-status`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Get students without accounts
  getStudentsWithoutAccount: async () => {
    try {
      const response = await api.get('/api/taikhoan/students-without-account');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching students without account:', error);
      return [];
    }
  },

  // Get teachers without accounts
  getTeachersWithoutAccount: async () => {
    try {
      const response = await api.get('/api/taikhoan/teachers-without-account');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching teachers without account:', error);
      return [];
    }
  },

  // Create account for multiple users
  bulkCreate: async (accountList) => {
    try {
      const response = await api.post('/api/taikhoan/bulk-create', accountList);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Get by role
  getByRole: async (role) => {
    try {
      const response = await api.get(`/api/taikhoan/role/${role}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching accounts by role:', error);
      return [];
    }
  },

  // Get active accounts
  getActive: async () => {
    try {
      const response = await api.get('/api/taikhoan/active');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching active accounts:', error);
      return [];
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      const response = await api.get('/api/taikhoan/statistics');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {};
    }
  },
};

export default taikhoanService;
