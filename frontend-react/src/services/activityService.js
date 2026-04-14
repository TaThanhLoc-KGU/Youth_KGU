import api from './api';

const enc = (s) => encodeURIComponent(s);

const activityService = {
  // Get all activities
  getAll: async () => {
    const response = await api.get('/api/hoat-dong');
    return response.data.data;
  },

  // Alias for compatibility
  getAllNoPagination: async () => {
    const response = await api.get('/api/hoat-dong');
    return response.data.data;
  },

  // Get activities with pagination
  getAllWithPagination: async (params = {}) => {
    const { page = 0, size = 10, sortBy = 'ngayToChuc', sortDir = 'desc' } = params;
    const response = await api.get('/api/hoat-dong/page', {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  },

  // Get activity by ID — dùng query param để tránh lỗi %2F trong path
  getById: async (maHoatDong) => {
    const response = await api.get('/api/hoat-dong/detail', { params: { ma: maHoatDong } });
    return response.data.data;
  },

  // Create activity
  create: async (activityData) => {
    const response = await api.post('/api/hoat-dong', activityData);
    return response.data.data;
  },

  // Update activity
  update: async (maHoatDong, activityData) => {
    const response = await api.put('/api/hoat-dong/update', activityData, { params: { ma: maHoatDong } });
    return response.data.data;
  },

  // Delete activity
  delete: async (maHoatDong) => {
    const response = await api.delete('/api/hoat-dong/delete', { params: { ma: maHoatDong } });
    return response.data;
  },

  // Filter by status
  getByStatus: async (status) => {
    const response = await api.get(`/api/hoat-dong/trang-thai/${status}`);
    return response.data.data;
  },

  // Filter by type
  getByType: async (type) => {
    const response = await api.get(`/api/hoat-dong/loai/${type}`);
    return response.data.data;
  },

  // Filter by level
  getByLevel: async (level) => {
    const response = await api.get(`/api/hoat-dong/cap-do/${level}`);
    return response.data.data;
  },

  // Get upcoming activities
  getUpcoming: async () => {
    const response = await api.get('/api/hoat-dong/upcoming');
    return response.data.data;
  },

  // Get ongoing activities
  getOngoing: async () => {
    const response = await api.get('/api/hoat-dong/ongoing');
    return response.data.data;
  },

  // Search activities
  search: async (keyword) => {
    const response = await api.get('/api/hoat-dong/search', {
      params: { keyword },
    });
    return response.data.data;
  },

  // Get by date range
  getByDateRange: async (startDate, endDate) => {
    const response = await api.get('/api/hoat-dong/date-range', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  // Open registration
  openRegistration: async (maHoatDong) => {
    const response = await api.post('/api/hoat-dong/open-registration', null, { params: { ma: maHoatDong } });
    return response.data;
  },

  // Close registration
  closeRegistration: async (maHoatDong) => {
    const response = await api.post('/api/hoat-dong/close-registration', null, { params: { ma: maHoatDong } });
    return response.data;
  },

  // Start activity
  start: async (maHoatDong) => {
    const response = await api.post('/api/hoat-dong/start', null, { params: { ma: maHoatDong } });
    return response.data;
  },

  // Revert activity start (only if no one has checked in yet)
  revertStart: async (maHoatDong) => {
    const response = await api.post('/api/hoat-dong/revert-start', null, { params: { ma: maHoatDong } });
    return response.data;
  },

  // Complete activity
  complete: async (maHoatDong) => {
    const response = await api.post('/api/hoat-dong/complete', null, { params: { ma: maHoatDong } });
    return response.data;
  },

  // Early terminate activity
  earlyTerminate: async (maHoatDong) => {
    const response = await api.post('/api/hoat-dong/ket-thuc-som', null, { params: { ma: maHoatDong } });
    return response.data;
  },

  // Cancel activity
  cancel: async (maHoatDong, reason) => {
    const response = await api.post('/api/hoat-dong/cancel', null, {
      params: { ma: maHoatDong, lyDo: reason },
    });
    return response.data;
  },

  // Get statistics
  getStatistics: async (maHoatDong) => {
    const response = await api.get('/api/hoat-dong/statistics/detail', { params: { ma: maHoatDong } });
    return response.data.data;
  },

  // Get statistics by status
  getStatisticsByStatus: async () => {
    const response = await api.get('/api/hoat-dong/statistics/by-status');
    return response.data.data;
  },

  // Get attendance status list
  getAttendanceStatusList: async (maHoatDong) => {
    const response = await api.get('/api/hoat-dong/attendance-status', { params: { ma: maHoatDong } });
    return response.data.data;
  },

  // Get current academic year & semester info
  getCurrentAcademicInfo: async () => {
    const response = await api.get('/api/hoat-dong/academic-info');
    return response.data.data;
  },

  // ========== REGISTRATION ==========

  // Register for activity
  register: async (data) => {
    const response = await api.post('/api/dang-ky', data);
    return response.data;
  },

  // Cancel registration
  cancelRegistration: async (maSv, maHoatDong) => {
    const response = await api.delete('/api/dang-ky', {
      params: { maSv, maHoatDong },
    });
    return response.data;
  },

  // Get registrations by activity
  getRegistrationsByActivity: async (maHoatDong) => {
    const response = await api.get(`/api/dang-ky/activity/${enc(maHoatDong)}`);
    return response.data.data;
  },

  // Get registrations by student
  getRegistrationsByStudent: async (maSv) => {
    const response = await api.get(`/api/dang-ky/student/${maSv}`);
    return response.data.data;
  },

  // ========== PUBLIC (không cần auth) ==========

  // Lấy tất cả hoạt động — public, dùng cho trang tin tức
  getPublic: async () => {
    const response = await api.get('/api/public/hoat-dong');
    return response.data.data;
  },

  // Danh sách sinh viên đã tham gia (chỉ tên + lớp) — public
  // Dùng query param để tránh lỗi khi maHoatDong chứa dấu '/'
  getPublicThamGia: async (maHoatDong) => {
    const response = await api.get('/api/public/hoat-dong/tham-gia', {
      params: { ma: maHoatDong },
    });
    return response.data.data;
  },

  // Get QR Code Base64
  getQRCode: async (maSv, maHoatDong) => {
    const response = await api.get('/api/dang-ky/qrcode-image', {
      params: { maSv, maHoatDong },
    });
    return response.data.data;
  },

  // ── Public registration (student, requires login) ─────────────────────────
  publicRegister: async (maHoatDong) => {
    const response = await api.post('/api/public/hoat-dong/dang-ky', null, {
      params: { ma: maHoatDong },
    });
    return response.data.data;
  },

  publicCancelRegister: async (maHoatDong) => {
    await api.delete('/api/public/hoat-dong/huy-dang-ky', {
      params: { ma: maHoatDong },
    });
  },

  publicCheckRegister: async (maHoatDong) => {
    const response = await api.get('/api/public/hoat-dong/trang-thai-dang-ky', {
      params: { ma: maHoatDong },
    });
    return response.data.data; // { daDangKy: bool, maSv: string }
  },
};

export default activityService;
