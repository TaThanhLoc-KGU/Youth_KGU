import api from './api';

const logsService = {
  // Get all logs with pagination
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/logs', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  },

  // Get log by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/logs/${id}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching log:', error);
      return null;
    }
  },

  // Search logs
  search: async (keyword) => {
    try {
      const response = await api.get('/api/logs/search', {
        params: { keyword },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching logs:', error);
      return [];
    }
  },

  // Filter logs
  filter: async (params = {}) => {
    try {
      const response = await api.get('/api/logs/filter', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error filtering logs:', error);
      return [];
    }
  },

  // Get logs by level
  getByLevel: async (level) => {
    try {
      const response = await api.get(`/api/logs/level/${level}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching logs by level:', error);
      return [];
    }
  },

  // Get logs by module
  getByModule: async (module) => {
    try {
      const response = await api.get(`/api/logs/module/${module}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching logs by module:', error);
      return [];
    }
  },

  // Get logs by date range
  getByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get('/api/logs/date-range', {
        params: { startDate, endDate },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching logs by date range:', error);
      return [];
    }
  },

  // Get logs by status
  getByStatus: async (status) => {
    try {
      const response = await api.get(`/api/logs/status/${status}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching logs by status:', error);
      return [];
    }
  },

  // Get log statistics
  getStatistics: async () => {
    try {
      const response = await api.get('/api/logs/statistics');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching log statistics:', error);
      return {};
    }
  },

  // Get recent logs (last 24 hours)
  getRecent: async (hours = 24) => {
    try {
      const response = await api.get('/api/logs/recent', {
        params: { hours },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      return [];
    }
  },

  // Get error logs
  getErrors: async () => {
    try {
      const response = await api.get('/api/logs/errors');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching error logs:', error);
      return [];
    }
  },

  // Delete old logs
  deleteOlderThan: async (days) => {
    try {
      const response = await api.delete('/api/logs/cleanup', {
        params: { days },
      });
      return response.data?.data;
    } catch (error) {
      console.error('Error deleting old logs:', error);
      throw error;
    }
  },

  // Export logs to CSV
  exportToCSV: async (params = {}) => {
    try {
      const response = await api.get('/api/logs/export/csv', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  },
};

export default logsService;
