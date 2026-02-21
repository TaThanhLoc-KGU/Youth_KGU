import api from './api';

const settingsService = {
  // Lấy tất cả quyền theo nhóm category
  getAllPermissions: async () => {
    try {
      const response = await api.get('/api/settings/permissions');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  // Lấy danh sách tài khoản quản lý
  getManagementAccounts: async () => {
    try {
      const response = await api.get('/api/settings/permissions/accounts');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching management accounts:', error);
      throw error;
    }
  },

  // Lấy danh sách quyền của 1 tài khoản
  getAccountPermissions: async (taikhoanId) => {
    try {
      const response = await api.get(`/api/settings/permissions/accounts/${taikhoanId}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching account permissions:', error);
      throw error;
    }
  },

  // Gán quyền cho tài khoản
  assignPermissions: async (taikhoanId, permissionIds) => {
    try {
      const response = await api.put(`/api/settings/permissions/accounts/${taikhoanId}`, permissionIds);
      return response.data;
    } catch (error) {
      console.error('Error assigning permissions:', error);
      throw error;
    }
  },

  // Khởi tạo dữ liệu quyền mặc định
  initPermissions: async () => {
    try {
      const response = await api.post('/api/settings/permissions/init');
      return response.data;
    } catch (error) {
      console.error('Error initializing permissions:', error);
      throw error;
    }
  },
};

export default settingsService;
