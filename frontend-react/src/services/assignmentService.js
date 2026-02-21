import api from './api';

/**
 * Service cho quản lý phân công điểm danh
 */
const assignmentService = {
  /**
   * Phân công người điểm danh cho hoạt động
   * @param {string} maHoatDong - Mã hoạt động
   * @param {string[]} danhSachMaBch - Danh sách mã BCH cần phân công
   * @param {string} vaiTro - Vai trò: CHINH hoặc PHU (mặc định: CHINH)
   * @param {string} ghiChu - Ghi chú
   * @returns {Promise}
   */
  assignAttendanceTakers: async (maHoatDong, danhSachMaBch, vaiTro = 'CHINH', ghiChu = '') => {
    const response = await api.post('/api/phan-cong-diem-danh', {
      maHoatDong,
      danhSachMaBch,
      vaiTro,
      ghiChu,
    });
    return response.data;
  },

  /**
   * Lấy danh sách người được phân công điểm danh cho một hoạt động
   * @param {string} maHoatDong - Mã hoạt động
   * @returns {Promise}
   */
  getAttendanceTakers: async (maHoatDong) => {
    const response = await api.get(`/api/phan-cong-diem-danh/hoat-dong/${maHoatDong}`);
    return response.data.data || [];
  },

  /**
   * Xóa phân công người điểm danh
   * @param {string} maHoatDong - Mã hoạt động
   * @param {string} maBch - Mã BCH
   * @returns {Promise}
   */
  removeAssignment: async (maHoatDong, maBch) => {
    const response = await api.delete('/api/phan-cong-diem-danh', {
      params: {
        maHoatDong,
        maBch,
      },
    });
    return response.data;
  },

  /**
   * Lấy danh sách hoạt động được phân công cho một BCH
   * @param {string} maBch - Mã BCH
   * @returns {Promise}
   */
  getAssignmentsByBCH: async (maBch) => {
    const response = await api.get(`/api/phan-cong-diem-danh/bch/${maBch}`);
    return response.data.data || [];
  },
};

export default assignmentService;
