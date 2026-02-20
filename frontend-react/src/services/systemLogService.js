import api from './api';

const systemLogService = {
  search: async (params = {}) => {
    const response = await api.get('/api/admin/logs', { params });
    return response.data?.data || { content: [], totalElements: 0, totalPages: 0 };
  },

  getModules: () => [
    'AUTHENTICATION', 'TAI_KHOAN', 'HOAT_DONG',
    'DIEM_DANH', 'PHAN_QUYEN', 'SYSTEM',
    'SINH_VIEN', 'GIANG_VIEN', 'BCH'
  ],

  getActions: () => [
    'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT',
    'REGISTER', 'CREATE', 'UPDATE', 'DELETE',
    'APPROVE', 'REJECT', 'BULK_CREATE',
    'GRANT_PERMISSION', 'REVOKE_PERMISSION', 'SCAN_QR'
  ],
};

export default systemLogService;
