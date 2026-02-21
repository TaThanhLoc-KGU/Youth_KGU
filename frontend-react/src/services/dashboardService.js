import api from './api';

const dashboardService = {
  // Get dashboard overview
  getDashboard: async () => {
    try {
      const response = await api.get('/api/thong-ke/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return null;
    }
  },

  // Get student count
  getStudentCount: async () => {
    try {
      const response = await api.get('/api/sinhvien/count');
      return response.data.data || { count: 0 };
    } catch (error) {
      console.error('Error fetching student count:', error);
      return { count: 0 };
    }
  },

  // Get activity overview
  getActivityOverview: async (startDate, endDate) => {
    try {
      const response = await api.get('/api/thong-ke/hoat-dong/tong-quan', {
        params: { startDate, endDate },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching activity overview:', error);
      return null;
    }
  },

  // Get activity trends (mock data - sẽ implement proper API sau)
  getActivityTrends: async () => {
    try {
      // API này cần được implement trong backend tại /api/thong-ke/activity-trends
      const response = await api.get('/api/thong-ke/activity-trends');
      return response.data.data;
    } catch (error) {
      // Fallback to mock data
      console.warn('Activity trends API not available, using mock data');
      return [
        { name: 'T2', value: 120 },
        { name: 'T3', value: 150 },
        { name: 'T4', value: 180 },
        { name: 'T5', value: 200 },
        { name: 'T6', value: 160 },
        { name: 'T7', value: 90 },
        { name: 'CN', value: 30 },
      ];
    }
  },

  // Get participation by faculty
  getParticipationByFaculty: async () => {
    try {
      // API này cần được implement trong backend tại /api/thong-ke/participation-by-faculty
      const response = await api.get('/api/thong-ke/participation-by-faculty');
      return response.data.data;
    } catch (error) {
      // Fallback to mock data
      console.warn('Participation by faculty API not available, using mock data');
      return [
        { label: 'Công nghệ thông tin', data: 35 },
        { label: 'Kỹ thuật', data: 25 },
        { label: 'Quản lý', data: 20 },
        { label: 'Kinh tế', data: 15 },
        { label: 'Ngoại ngữ', data: 5 },
      ];
    }
  },

  // Get top students
  getTopStudents: async (limit = 10) => {
    try {
      const response = await api.get('/api/thong-ke/top-students', {
        params: { limit },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching top students:', error);
      return [];
    }
  },

  // Get upcoming activities
  getUpcomingActivities: async (days = 7) => {
    try {
      const response = await api.get('/api/hoat-dong/upcoming', {
        params: { days },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching upcoming activities:', error);
      return [];
    }
  },

  // Get activity statistics by status
  getActivityStatistics: async () => {
    try {
      const response = await api.get('/api/thong-ke/hoat-dong/statistics');
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching activity statistics:', error);
      return {};
    }
  },

  // Get attendance statistics
  getAttendanceStatistics: async () => {
    try {
      // API này cần được implement trong backend tại /api/thong-ke/attendance-statistics
      const response = await api.get('/api/thong-ke/attendance-statistics');
      return response.data.data;
    } catch (error) {
      // Fallback to mock data
      console.warn('Attendance statistics API not available, using mock data');
      return {
        onTime: 65,
        late: 20,
        absent: 15,
      };
    }
  },

  // Get student history
  getStudentHistory: async (maSv) => {
    try {
      const response = await api.get(`/api/thong-ke/sinh-vien/${maSv}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching student history:', error);
      return null;
    }
  },

  // Get BCH overview
  getBCHOverview: async () => {
    try {
      const response = await api.get('/api/thong-ke/bch/overview');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching BCH overview:', error);
      return null;
    }
  },

  // Get activity report
  getActivityReport: async (maHoatDong) => {
    try {
      const response = await api.get(`/api/thong-ke/hoat-dong/${maHoatDong}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching activity report:', error);
      return null;
    }
  },
};

export default dashboardService;
