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
      const response = await api.get('/api/baocao/thongke');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching overall statistics:', error);
      return {};
    }
  },

  getReportData: async (type, params) => {
    try {
      const response = await api.get(`/api/baocao/${type}`, { params });
      return response.data?.data?.data || [];
    } catch (error) {
      console.error('Error fetching report data:', error);
      return [];
    }
  },

  // Báo cáo hoạt động (theo khoảng ngày), có breakdown theo từng đoàn khoa
  getActivityReport: async (params) => {
    try {
      const response = await api.get('/api/baocao/general', { params });
      return response.data?.data?.data || [];
    } catch (error) {
      console.error('Error fetching activity report:', error);
      return [];
    }
  },

  // Báo cáo tháng: trả về { data: [], tongHoatDong, tongDangKy, tongDiemDanh, tyLe }
  getMonthlyReport: async (params) => {
    try {
      const response = await api.get('/api/baocao/thang', { params });
      return response.data?.data || { data: [], tongHoatDong: 0, tongDangKy: 0, tongDiemDanh: 0, tyLe: 0 };
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      return { data: [], tongHoatDong: 0, tongDangKy: 0, tongDiemDanh: 0, tyLe: 0 };
    }
  },

  // Báo cáo quý: trả về { tongHoatDong, tongDangKy, tongDiemDanh, tyLeTong, theoKhoa: [], soKhoaKhongThamGia }
  getQuarterlyReport: async (params) => {
    try {
      const response = await api.get('/api/baocao/quy', { params });
      return response.data?.data || { theoKhoa: [], tongHoatDong: 0, tongDangKy: 0, tongDiemDanh: 0, tyLeTong: 0, soKhoaKhongThamGia: 0 };
    } catch (error) {
      console.error('Error fetching quarterly report:', error);
      return { theoKhoa: [], tongHoatDong: 0, tongDangKy: 0, tongDiemDanh: 0, tyLeTong: 0, soKhoaKhongThamGia: 0 };
    }
  },

  exportReportExcel: async (type, params = {}) => {
    try {
      const response = await api.get(`/api/baocao/xuat/${type}`, {
        params,
        responseType: 'blob',
      });
      const filename = response.headers['content-disposition']
        ?.match(/filename="?([^"]+)"?/)?.[1] || `bao_cao_${type}.xlsx`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', decodeURIComponent(filename));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  // Xuất Excel báo cáo tháng
  exportMonthlyExcel: async (from, to, month, year) => {
    try {
      const response = await api.get('/api/baocao/xuat/thang', {
        params: { from, to, thang: month, nam: year },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bao_cao_thang_${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting monthly report:', error);
      throw error;
    }
  },

  // Xuất Excel báo cáo quý
  exportQuarterlyExcel: async (from, to, quarter, year) => {
    try {
      const response = await api.get('/api/baocao/xuat/quy', {
        params: { from, to, quy: quarter, nam: year },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bao_cao_quy${quarter}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting quarterly report:', error);
      throw error;
    }
  },
};

export default attendanceService;
