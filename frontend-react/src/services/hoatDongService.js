import api from './api';

const hoatDongService = {
  // Get all activities
  getAll: async () => {
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

  // Lưu ý: getById / update / delete đã BỎ — chúng trỏ tới /api/hoat-dong/{ma} (không tồn tại).
  // Dùng activityService (getById → /detail?ma=, update → /update?ma=, delete → /delete?ma=).

  // Create activity — kèm file quyết định (PDF/Word...) tùy chọn
  create: async (activityData, quyetDinhFile) => {
    if (quyetDinhFile) {
      const formData = new FormData();
      formData.append('data', new Blob([JSON.stringify(activityData)], { type: 'application/json' }));
      formData.append('quyetDinhFile', quyetDinhFile);
      const response = await api.post('/api/hoat-dong', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    }
    const response = await api.post('/api/hoat-dong', activityData);
    return response.data.data;
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

  // Complete activity
  complete: async (maHoatDong) => {
    const response = await api.post('/api/hoat-dong/complete', null, { params: { ma: maHoatDong } });
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

  // ── Approval workflow (CLB/Khoa activities) ───────────────────
  getChouDuyet: async () => {
    const response = await api.get('/api/hoat-dong/cho-duyet');
    return response.data.data || [];
  },

  duyet: async (maHoatDong, trangThaiMoi = 'DANG_MO_DANG_KY') => {
    const response = await api.put('/api/hoat-dong/duyet', null, {
      params: { ma: maHoatDong, trangThaiMoi },
    });
    return response.data.data;
  },

  tuChoi: async (maHoatDong, lyDo = '') => {
    const response = await api.put('/api/hoat-dong/tu-choi', { lyDo }, {
      params: { ma: maHoatDong },
    });
    return response.data.data;
  },

  guiEmailThongBao: async (maHoatDong) => {
    const response = await api.post(`/api/hoat-dong/${encodeURIComponent(maHoatDong)}/gui-email`);
    return response.data;
  },

  guiZaloThongBao: async (maHoatDong) => {
    const response = await api.post(`/api/hoat-dong/${encodeURIComponent(maHoatDong)}/gui-zalo`);
    return response.data;
  },

  guiThongBaoDayDu: async (maHoatDong) => {
    const response = await api.post(`/api/hoat-dong/${encodeURIComponent(maHoatDong)}/gui-tat-ca`);
    return response.data;
  },

  // Công khai / Ẩn hoạt động khỏi danh sách công khai
  congKhai: async (maHoatDong) => {
    const response = await api.post('/api/hoat-dong/cong-khai', null, { params: { ma: maHoatDong } });
    return response.data;
  },

  an: async (maHoatDong) => {
    const response = await api.post('/api/hoat-dong/an', null, { params: { ma: maHoatDong } });
    return response.data;
  },
};

export default hoatDongService;
