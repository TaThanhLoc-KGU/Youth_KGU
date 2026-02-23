import api from './api';

const permissionService = {
  // Lấy tất cả permissions nhóm theo category
  getAllGrouped: async () => {
    const response = await api.get('/api/permissions/all');
    return response.data?.data || {};
  },

  // Lấy permission IDs của một role
  getRolePermissions: async (roleName) => {
    const response = await api.get(`/api/permissions/role/${roleName}`);
    return response.data?.data || [];
  },

  // Cập nhật quyền nhóm (yêu cầu mật khẩu)
  updateRolePermissions: async (roleName, permissionIds, adminUsername, adminPassword) => {
    const response = await api.put(`/api/permissions/role/${roleName}`, {
      permissionIds, adminUsername, adminPassword
    });
    return response.data;
  },

  // Lấy quyền của chính mình (dùng JWT, không cần ID) - mọi người dùng đã đăng nhập gọi được
  getMyPermissions: async () => {
    const response = await api.get('/api/permissions/me');
    return response.data?.data;
  },

  // Lấy quyền tổng hợp của tài khoản theo ID (chỉ ADMIN)
  getAccountPermissions: async (taiKhoanId) => {
    const response = await api.get(`/api/permissions/account/${taiKhoanId}`);
    return response.data?.data;
  },

  // Cập nhật quyền riêng tài khoản (yêu cầu mật khẩu)
  updateAccountPermissions: async (taiKhoanId, { grantIds, revokeIds, ghiChu, adminUsername, adminPassword, grantedBy }) => {
    const response = await api.put(`/api/permissions/account/${taiKhoanId}`, {
      grantIds, revokeIds, ghiChu, adminUsername, adminPassword, grantedBy
    });
    return response.data;
  },

  // Reset quyền tài khoản về mặc định nhóm
  resetAccountPermissions: async (taiKhoanId, adminUsername, adminPassword) => {
    const response = await api.delete(`/api/permissions/account/${taiKhoanId}/reset`, {
      data: { adminUsername, adminPassword }
    });
    return response.data;
  },
};

export default permissionService;
