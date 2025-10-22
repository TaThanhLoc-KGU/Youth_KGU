import api from './api';

const activityService = {
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

  // Get activity by ID
  getById: async (maHoatDong) => {
    const response = await api.get(`/api/hoat-dong/${maHoatDong}`);
    return response.data.data;
  },

  // Create activity
  create: async (activityData) => {
    const response = await api.post('/api/hoat-dong', activityData);
    return response.data.data;
  },

  // Update activity
  update: async (maHoatDong, activityData) => {
    const response = await api.put(`/api/hoat-dong/${maHoatDong}`, activityData);
    return response.data.data;
  },

  // Delete activity
  delete: async (maHoatDong) => {
    const response = await api.delete(`/api/hoat-dong/${maHoatDong}`);
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
    const response = await api.post(`/api/hoat-dong/${maHoatDong}/open-registration`);
    return response.data;
  },

  // Close registration
  closeRegistration: async (maHoatDong) => {
    const response = await api.post(`/api/hoat-dong/${maHoatDong}/close-registration`);
    return response.data;
  },

  // Start activity
  start: async (maHoatDong) => {
    const response = await api.post(`/api/hoat-dong/${maHoatDong}/start`);
    return response.data;
  },

  // Complete activity
  complete: async (maHoatDong) => {
    const response = await api.post(`/api/hoat-dong/${maHoatDong}/complete`);
    return response.data;
  },

  // Cancel activity
  cancel: async (maHoatDong, reason) => {
    const response = await api.post(`/api/hoat-dong/${maHoatDong}/cancel`, null, {
      params: { lyDo: reason },
    });
    return response.data;
  },

  // Get statistics
  getStatistics: async (maHoatDong) => {
    const response = await api.get(`/api/hoat-dong/${maHoatDong}/statistics`);
    return response.data.data;
  },

  // Get statistics by status
  getStatisticsByStatus: async () => {
    const response = await api.get('/api/hoat-dong/statistics/by-status');
    return response.data.data;
  },
};

export default activityService;
