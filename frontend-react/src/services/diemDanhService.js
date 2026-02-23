import api from './api';

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
    const response = await api.get(`/api/diem-danh/activity/${maHoatDong}`);
    return response.data.data;
  },

  // Danh sách đã check-in
  getCheckedIn: async (maHoatDong) => {
    const response = await api.get(`/api/diem-danh/activity/${maHoatDong}/checked-in`);
    return response.data.data;
  },

  // Danh sách chưa check-in
  getNotCheckedIn: async (maHoatDong) => {
    const response = await api.get(`/api/diem-danh/activity/${maHoatDong}/not-checked-in`);
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
    const response = await api.get(`/api/diem-danh/statistics/${maHoatDong}`);
    return response.data.data;
  },

  // Xuất file Excel điểm danh
  exportExcel: async (maHoatDong) => {
    const response = await api.get(`/api/diem-danh/activity/${maHoatDong}/export`, {
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
};

export default diemDanhService;
