import api from './api';

const enc = (s) => encodeURIComponent(s);

const diemDanhService = {
  // Lịch sử điểm danh của sinh viên
  getByStudent: async (maSv) => {
    const response = await api.get(`/api/diem-danh/student/${maSv}`);
    return response.data.data;
  },

  // Thống kê tham gia của sinh viên
  getStudentStats: async (maSv) => {
    const response = await api.get(`/api/diem-danh/statistics/student/${maSv}`);
    return response.data.data;
  },

  // Danh sách điểm danh theo hoạt động
  getByActivity: async (maHoatDong) => {
    const response = await api.get(`/api/diem-danh/activity/${enc(maHoatDong)}`);
    return response.data.data;
  },

  // Danh sách đã check-in
  getCheckedIn: async (maHoatDong) => {
    const response = await api.get(`/api/diem-danh/activity/${enc(maHoatDong)}/checked-in`);
    return response.data.data;
  },

  // Danh sách chưa check-in
  getNotCheckedIn: async (maHoatDong) => {
    const response = await api.get(`/api/diem-danh/activity/${enc(maHoatDong)}/not-checked-in`);
    return response.data.data;
  },

  // Quét QR Code để điểm danh
  scanQR: async (maQR, options = {}) => {
    const response = await api.post('/api/diem-danh/scan', {
      maQR,
      maBchXacNhan: options.maBchXacNhan || null,
      latitude: options.latitude || null,
      longitude: options.longitude || null,
      thietBi: options.thietBi || 'Web Browser',
      ghiChu: options.ghiChu || null,
    });
    return response.data; // DiemDanhQRResponse: { success, message, data, timestamp }
  },

  // ===== SELF-SERVICE QR ATTENDANCE =====
  
  // Lấy mã QR động
  getDynamicQRToken: async (maHoatDong) => {
    const response = await api.get(`/api/diem-danh/activity/${enc(maHoatDong)}/dynamic-qr`);
    return response.data.data;
  },

  // Tự điểm danh bằng QR động và GPS
  selfScanQR: async (token, latitude, longitude) => {
    const response = await api.post('/api/diem-danh/self-scan', {
      token,
      latitude,
      longitude
    });
    return response.data; // DiemDanhQRResponse
  },
  // ======================================

  // Điểm danh thủ công hàng loạt
  manualCheckInBulk: async (maHoatDong, maSvList, ghiChu = null) => {
    const response = await api.post('/api/diem-danh/manual', {
      maHoatDong,
      maSvList,
      ghiChu,
    });
    return response.data.data; // Map<maSv, result>
  },

  // Check-out (dùng QR hoặc ID)
  checkOut: async (data) => {
    const response = await api.post('/api/diem-danh/check-out', {
      diemDanhId: data.diemDanhId || null,
      maQR: data.maQR || null,
      maBchXacNhan: data.maBchXacNhan || null,
      ghiChu: data.ghiChu || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      thietBi: data.thietBi || 'Web Browser',
    });
    return response.data.data;
  },

  // Thống kê điểm danh theo hoạt động
  getStatistics: async (maHoatDong) => {
    const response = await api.get(`/api/diem-danh/statistics/${enc(maHoatDong)}`);
    return response.data.data;
  },

  // Danh sách hoạt động kèm thống kê điểm danh (dành cho trang chọn hoạt động điểm danh)
  // filter: 'hom_nay' | 'dang_dien_ra' | 'sap_bat_dau' | 'tat_ca'
  getActivitiesOverview: async (filter = 'hom_nay') => {
    const response = await api.get('/api/diem-danh/activities-overview', {
      params: { filter },
    });
    return response.data.data;
  },

  // Xuất file Excel điểm danh
  exportExcel: async (maHoatDong) => {
    const response = await api.get(`/api/diem-danh/activity/${enc(maHoatDong)}/export`, {
      responseType: 'blob',
    });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `diem_danh_${maHoatDong}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  // Admin thêm sinh viên vào điểm danh theo MSSV
  themThuCongTheoMSSV: async (maHoatDong, maSv, ghiChu = '') => {
    const response = await api.post('/api/diem-danh/them-thu-cong', { maHoatDong, maSv, ghiChu });
    return response.data.data;
  },

  // Hoạt động không đăng ký — thêm thủ công (list maSv)
  themThuCongKhongDangKy: async (maHoatDong, maSvList) => {
    const response = await api.post(`/api/diem-danh/khong-dang-ky/${maHoatDong}/them-thu-cong`, maSvList);
    return response.data?.data || {};
  },

  // Hoạt động không đăng ký — import Excel
  importExcelKhongDangKy: async (maHoatDong, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/diem-danh/khong-dang-ky/${maHoatDong}/import-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data || {};
  },

  // Hoạt động không đăng ký — xóa sinh viên
  xoaKhoiDanhSachKhongDangKy: async (maHoatDong, maSv) => {
    const response = await api.delete(`/api/diem-danh/khong-dang-ky/${maHoatDong}/xoa/${maSv}`);
    return response.data?.data;
  },
};

export default diemDanhService;
