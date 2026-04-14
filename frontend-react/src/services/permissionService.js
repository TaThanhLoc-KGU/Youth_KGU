import api from './api';

const permissionService = {
  // Lấy quyền của chính mình
  getMyPermissions: async () => {
    const response = await api.get('/api/permissions/me');
    return response.data?.data;
  },

  // Lấy tất cả permissions nhóm theo category (dùng cho UI checkbox)
  getAllPermissions: async () => {
    const response = await api.get('/api/permissions/all');
    return response.data?.data || {};
  },

  // Lấy quyền hiện tại của một tài khoản
  getAccountPermissions: async (taiKhoanId) => {
    const response = await api.get(`/api/permissions/account/${taiKhoanId}`);
    return response.data?.data;
  },

  // Gán quyền cho tài khoản (atomic replace)
  // body: { laAdmin: bool, permissionIds: [...], adminId: null }
  setAccountPermissions: async (taiKhoanId, body) => {
    const response = await api.put(`/api/permissions/account/${taiKhoanId}`, body);
    return response.data;
  },
};

export default permissionService;
