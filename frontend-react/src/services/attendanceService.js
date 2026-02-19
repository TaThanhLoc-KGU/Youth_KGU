import api from './api';

const attendanceService = {
  // ========== QR SCAN & CHECK-IN/OUT ==========

  // Scan QR Code for Check-in
  scanQRCode: async (data) => {
    try {
      const response = await api.post('/api/diem-danh/scan', data);
      return response.data;
    } catch (error) {
      console.error('Error scanning QR code:', error);
      throw error;
    }
  },

  // Validate QR Code before scanning
  validateQRCode: async (maQR, maHoatDong) => {
    try {
      const response = await api.get('/api/diem-danh/validate', {
        params: { maQR, maHoatDong },
      });
      return response.data;
    } catch (error) {
      console.error('Error validating QR code:', error);
      throw error;
    }
  },

  // Check-out (using ID or QR)
  checkOut: async (data) => {
    try {
      const response = await api.post('/api/diem-danh/check-out', data);
      return response.data;
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  },

  // ========== QUERY ATTENDANCE ==========

  // Get attendance by activity
  getByActivity: async (maHoatDong) => {
    try {
      const response = await api.get(`/api/diem-danh/activity/${maHoatDong}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching attendance by activity:', error);
      return [];
    }
  },

  // Get checked-in students
  getCheckedIn: async (maHoatDong) => {
    try {
      const response = await api.get(`/api/diem-danh/activity/${maHoatDong}/checked-in`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching checked-in students:', error);
      return [];
    }
  },

  // Get not checked-in students
  getNotCheckedIn: async (maHoatDong) => {
    try {
      const response = await api.get(`/api/diem-danh/activity/${maHoatDong}/not-checked-in`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching not checked-in students:', error);
      return [];
    }
  },

  // Get attendance history by student
  getByStudent: async (maSv) => {
    try {
      const response = await api.get(`/api/diem-danh/student/${maSv}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching attendance by student:', error);
      return [];
    }
  },

  // ========== ADMIN ACTIONS ==========

  // Mark student as absent
  markAbsent: async (data) => {
    try {
      const response = await api.post('/api/diem-danh/mark-absent', data);
      return response.data;
    } catch (error) {
      console.error('Error marking absent:', error);
      throw error;
    }
  },

  // Delete attendance record
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/diem-danh/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error;
    }
  },

  // ========== STATISTICS ==========

  // Get statistics for a specific activity
  getStatistics: async (maHoatDong) => {
    try {
      const response = await api.get(`/api/diem-danh/statistics/${maHoatDong}`);
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching attendance statistics:', error);
      return {};
    }
  },

  // Get student attendance history statistics
  getStudentHistory: async (maSv) => {
    try {
      const response = await api.get(`/api/diem-danh/statistics/student/${maSv}`);
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching student history:', error);
      return {};
    }
  },

  // Get overall statistics (Dashboard)
  getStatisticsOverview: async () => {
    try {
      const response = await api.get('/api/diem-danh/statistics');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching overall statistics:', error);
      return {};
    }
  },
};

export default attendanceService;
