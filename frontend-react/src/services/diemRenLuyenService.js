import api from './api';

/**
 * Service cho điểm rèn luyện sinh viên.
 * Điểm rèn luyện được tính từ các hoạt động sinh viên đã tham gia
 * (daDiemDanh = true) và điểm của từng hoạt động (diemRenLuyen).
 */
const diemRenLuyenService = {
  // Lấy lịch sử điểm danh (dùng để tính điểm rèn luyện)
  getStudentRecords: async (maSv) => {
    const response = await api.get(`/api/diem-danh/student/${maSv}`);
    return response.data.data;
  },

  // Lấy thống kê tham gia của sinh viên
  getStudentSummary: async (maSv) => {
    const response = await api.get(`/api/diem-danh/statistics/student/${maSv}`);
    return response.data.data;
  },
};

export default diemRenLuyenService;
