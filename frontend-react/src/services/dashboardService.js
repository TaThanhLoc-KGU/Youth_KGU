import api from './api';

// Suppress 403 errors silently (user lacks permission) — only log unexpected errors
const silentFetch = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (error) {
    if (error?.response?.status === 403 || error?.response?.status === 401) {
      return fallback; // User doesn’t have this permission — silent
    }
    console.error('Dashboard API error:', error?.response?.status, error?.config?.url);
    return fallback;
  }
};

const dashboardService = {
  // Get unified dashboard stats (tongQuan, xuHuongTheoThang, topHoatDong, topSinhVien, theoKhoa)
  getDashboardStats: () =>
    silentFetch(() => api.get('/api/baocao/dashboard').then((r) => r.data.data)),

  // Get dashboard overview
  getDashboard: () =>
    silentFetch(() => api.get('/api/thong-ke/dashboard').then((r) => r.data.data)),

  // Get student count
  getStudentCount: () =>
    silentFetch(() => api.get('/api/sinhvien/count').then((r) => r.data || { count: 0 }), { count: 0 }),

  // Get activity overview
  getActivityOverview: (startDate, endDate) =>
    silentFetch(() =>
      api.get('/api/thong-ke/hoat-dong/tong-quan', { params: { startDate, endDate } })
        .then((r) => r.data.data)
    ),

  // Get activity trends — fallback to mock data when API not available / no permission
  getActivityTrends: () =>
    silentFetch(
      () => api.get('/api/thong-ke/activity-trends').then((r) => r.data.data),
      [
        { name: 'T2', value: 120 }, { name: 'T3', value: 150 }, { name: 'T4', value: 180 },
        { name: 'T5', value: 200 }, { name: 'T6', value: 160 }, { name: 'T7', value: 90 },
        { name: 'CN', value: 30 },
      ]
    ),

  // Get participation by faculty — fallback to mock data when API not available / no permission
  getParticipationByFaculty: () =>
    silentFetch(
      () => api.get('/api/thong-ke/participation-by-faculty').then((r) => r.data.data),
      [
        { label: 'Công nghệ thông tin', data: 35 },
        { label: 'Kỹ thuật', data: 25 },
        { label: 'Quản lý', data: 20 },
        { label: 'Kinh tế', data: 15 },
        { label: 'Ngoại ngữ', data: 5 },
      ]
    ),

  // Get top students
  getTopStudents: (limit = 10) =>
    silentFetch(() => api.get('/api/thong-ke/top-students', { params: { limit } }).then((r) => r.data.data || []), []),

  // Get upcoming activities
  getUpcomingActivities: (days = 7) =>
    silentFetch(() => api.get('/api/hoat-dong/upcoming', { params: { days } }).then((r) => r.data.data || []), []),

  // Get activity statistics by status
  getActivityStatistics: () =>
    silentFetch(() => api.get('/api/thong-ke/hoat-dong/statistics').then((r) => r.data.data || {}), {}),

  // Get attendance statistics — fallback to mock data when API not available
  getAttendanceStatistics: () =>
    silentFetch(
      () => api.get('/api/thong-ke/attendance-statistics').then((r) => r.data.data),
      { onTime: 65, late: 20, absent: 15 }
    ),

  // Get student history
  getStudentHistory: (maSv) =>
    silentFetch(() => api.get(`/api/thong-ke/sinh-vien/${maSv}`).then((r) => r.data.data)),

  // Get BCH overview
  getBCHOverview: () =>
    silentFetch(() => api.get('/api/thong-ke/bch/overview').then((r) => r.data.data)),

  // Get activity report
  getActivityReport: (maHoatDong) =>
    silentFetch(() => api.get(`/api/thong-ke/hoat-dong/${maHoatDong}`).then((r) => r.data.data)),
};

export default dashboardService;
