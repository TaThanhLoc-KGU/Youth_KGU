import api from './api';

const permissionService = {
  // ── Quyền của chính mình ─────────────────────────────────────────────────
  getMyPermissions: async () => {
    const res = await api.get('/api/permissions/me');
    return res.data?.data;
  },

  // ── Tất cả permissions nhóm theo category ────────────────────────────────
  getAllPermissions: async () => {
    const res = await api.get('/api/permissions/all');
    return res.data?.data || {};
  },

  // ── Danh sách roles ──────────────────────────────────────────────────────
  getRoles: async () => {
    const res = await api.get('/api/permissions/roles');
    return res.data?.data || [];
  },

  // ── Quyền mặc định theo role (ma trận vai trò) ───────────────────────────
  getRoleDefaults: async () => {
    const res = await api.get('/api/permissions/role-defaults');
    return res.data?.data || {};
  },

  setRoleDefaults: async (vaiTro, permissionIds) => {
    const res = await api.put(`/api/permissions/role-defaults/${vaiTro}`, { permissionIds });
    return res.data;
  },

  // ── Compatibility wrapper for PermissionMatrixPage (LevelMatrixTab) ──────
  // Maps old BCH_LEVEL concept to new role-defaults API
  getPermissionMatrix: async () => {
    const [defaults, allPerms] = await Promise.all([
      api.get('/api/permissions/role-defaults').then(r => r.data?.data || {}),
      api.get('/api/permissions/all').then(r => r.data?.data || {}),
    ]);
    return { matrix: defaults, permissions: allPerms };
  },

  updateLevelPermissions: async (vaiTro, permissionIds) => {
    const res = await api.put(`/api/permissions/role-defaults/${vaiTro}`, { permissionIds });
    return res.data;
  },

  // ── Quyền của một tài khoản cụ thể ──────────────────────────────────────
  getAccountPermissions: async (taiKhoanId) => {
    const res = await api.get(`/api/permissions/account/${taiKhoanId}`);
    return res.data?.data;
  },

  // Gán quyền cho tài khoản (atomic replace)
  setAccountPermissions: async (taiKhoanId, body) => {
    const res = await api.put(`/api/permissions/account/${taiKhoanId}`, body);
    return res.data;
  },

  // Cập nhật quyền tùy chỉnh — dùng bởi PermissionMatrixPage Tab 2
  updateAccountPermissions: async (taiKhoanId, { grantIds = [] }) => {
    const res = await api.put(`/api/permissions/account/${taiKhoanId}`, { permissionIds: grantIds });
    return res.data;
  },

  // Reset quyền tùy chỉnh về rỗng (chỉ còn quyền mặc định từ role)
  resetAccountPermissions: async (taiKhoanId) => {
    const res = await api.put(`/api/permissions/account/${taiKhoanId}`, { permissionIds: [] });
    return res.data;
  },

  // ── ChucVu-based permissions (SettingsPermissionsPage) ───────────────────
  // Backend chưa hỗ trợ chức vụ-based permissions → trả về rỗng
  getRolePermissions: async (_maChucVu) => [],
  updateRolePermissions: async (_maChucVu, _permIds) => ({}),
};

export default permissionService;
