import api from './api';

const dangKyService = {
  // Đăng ký tham gia hoạt động
  register: async (maSv, maHoatDong) => {
    const response = await api.post('/api/dang-ky', { maSv, maHoatDong });
    return response.data.data;
  },

  // Hủy đăng ký
  cancel: async (maSv, maHoatDong) => {
    const response = await api.delete('/api/dang-ky', {
      params: { maSv, maHoatDong },
    });
    return response.data;
  },

  // Danh sách đăng ký của sinh viên
  getByStudent: async (maSv) => {
    const response = await api.get(`/api/dang-ky/student/${maSv}`);
    return response.data.data;
  },

  // Danh sách đăng ký theo hoạt động
  getByActivity: async (maHoatDong) => {
    const response = await api.get(`/api/dang-ky/activity/${maHoatDong}`);
    return response.data.data;
  },

  // Lấy QR code base64 image
  getQRCodeImage: async (maSv, maHoatDong) => {
    const response = await api.get('/api/dang-ky/qrcode-image', {
      params: { maSv, maHoatDong },
    });
    return response.data.data;
  },

  // Thống kê đăng ký của hoạt động
  getStatistics: async (maHoatDong) => {
    const response = await api.get(`/api/dang-ky/statistics/${maHoatDong}`);
    return response.data.data;
  },

  /**
   * Sinh viên gửi vị trí GPS khi mở màn hình hiển thị QR.
   * Dùng để phát hiện điểm danh hộ (vị trí sinh viên khác với địa điểm hoạt động).
   */
  submitCheckInLocation: async (maQR, latitude, longitude) => {
    const response = await api.post('/api/dang-ky/check-in-location', { maQR, latitude, longitude });
    return response.data;
  },
};

export default dangKyService;
