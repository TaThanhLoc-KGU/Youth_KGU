import api from './api';

const logsService = {
  // Lấy danh sách nhật ký (mặc định 100 bản ghi mới nhất)
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/logs', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  },

  // Lấy chi tiết một nhật ký
  getById: async (id) => {
    try {
      const response = await api.get(`/api/logs/${id}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching log:', error);
      return null;
    }
  },

  // Tìm kiếm / lọc nhật ký
  // Params: module, action, userId, startTime, endTime, keyword, page, size
  search: async (params = {}) => {
    try {
      const response = await api.get('/api/logs/search', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching logs:', error);
      return [];
    }
  },

  // Thống kê nhật ký
  getStatistics: async () => {
    try {
      const response = await api.get('/api/logs/statistics');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching log statistics:', error);
      return {};
    }
  },

  // Lấy danh sách modules
  getModules: async () => {
    try {
      const response = await api.get('/api/logs/modules');
      return response.data?.data || [];
    } catch (error) {
      return [];
    }
  },

  // Lấy danh sách loại thao tác
  getActions: async () => {
    try {
      const response = await api.get('/api/logs/actions');
      return response.data?.data || [];
    } catch (error) {
      return [];
    }
  },

  // Xóa nhật ký cũ
  deleteOlderThan: async (days = 30) => {
    try {
      const response = await api.delete('/api/logs/cleanup', { params: { daysToKeep: days } });
      return response.data;
    } catch (error) {
      console.error('Error deleting old logs:', error);
      throw error;
    }
  },
};

export default logsService;
