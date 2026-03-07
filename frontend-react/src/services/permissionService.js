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

  // Cập nhật quyền nhóm (không cần password)
  updateRolePermissions: async (roleName, permissionIds) => {
    const response = await api.put(`/api/permissions/role/${roleName}`, { permissionIds });
    return response.data;
  },

  // Lấy permission matrix cho cả 3 BCH levels
  getPermissionMatrix: async () => {
    const response = await api.get('/api/permissions/matrix');
    return response.data?.data || { matrix: {}, permissions: {} };
  },

  // Cập nhật permissions cho một BCH level (1/2/3)
  updateLevelPermissions: async (level, permissionIds) => {
    const response = await api.put(`/api/permissions/level/${level}`, { permissionIds });
    return response.data;
  },

  // Lấy quyền của chính mình (dùng JWT, không cần ID)
  getMyPermissions: async () => {
    const response = await api.get('/api/permissions/me');
    return response.data?.data;
  },

  // Lấy quyền tổng hợp của tài khoản theo ID
  getAccountPermissions: async (taiKhoanId) => {
    const response = await api.get(`/api/permissions/account/${taiKhoanId}`);
    return response.data?.data;
  },

  // Cập nhật quyền riêng tài khoản (không cần password)
  updateAccountPermissions: async (taiKhoanId, { grantIds, revokeIds, ghiChu, grantedBy }) => {
    const response = await api.put(`/api/permissions/account/${taiKhoanId}`, {
      grantIds, revokeIds, ghiChu, grantedBy,
    });
    return response.data;
  },

  // Reset quyền tài khoản về mặc định nhóm
  resetAccountPermissions: async (taiKhoanId) => {
    const response = await api.delete(`/api/permissions/account/${taiKhoanId}/reset`);
    return response.data;
  },
};

export default permissionService;
