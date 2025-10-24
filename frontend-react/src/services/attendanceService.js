import api from './api';

const attendanceService = {
  // Get attendance report
  getReport: async (params = {}) => {
    try {
      const response = await api.get('/api/diemdanh/report', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      return [];
    }
  },

  // Get attendance statistics
  getStatistics: async (params = {}) => {
    try {
      const response = await api.get('/api/diemdanh/statistics', { params });
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching attendance statistics:', error);
      return {};
    }
  },

  // Get attendance by date range
  getByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get('/api/diemdanh/date-range', {
        params: { startDate, endDate },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching attendance by date range:', error);
      return [];
    }
  },

  // Get attendance by class
  getByClass: async (maLop) => {
    try {
      const response = await api.get(`/api/diemdanh/lop/${maLop}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching attendance by class:', error);
      return [];
    }
  },

  // Get attendance by student
  getByStudent: async (maSv) => {
    try {
      const response = await api.get(`/api/diemdanh/sinhvien/${maSv}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching attendance by student:', error);
      return [];
    }
  },

  // Get attendance trends
  getTrends: async (days = 7) => {
    try {
      const response = await api.get('/api/diemdanh/trends', {
        params: { days },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching attendance trends:', error);
      return [];
    }
  },

  // Export attendance report
  exportReport: async (params = {}) => {
    try {
      const response = await api.get('/api/diemdanh/export', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting attendance report:', error);
      throw error;
    }
  },

  // Get attendance rate by class
  getRateByClass: async () => {
    try {
      const response = await api.get('/api/diemdanh/rate-by-class');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching attendance rate by class:', error);
      return [];
    }
  },
};

export default attendanceService;
