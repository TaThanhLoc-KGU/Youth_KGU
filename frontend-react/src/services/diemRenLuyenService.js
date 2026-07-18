import api from './api';

/**
 * Service cho điểm rèn luyện sinh viên.
 * Điểm rèn luyện được tính từ các hoạt động sinh viên đã tham gia
 * (daDiemDanh = true) và điểm của từng hoạt động (diemRenLuyen).
 */
const diemRenLuyenService = {
  // Lịch sử điểm danh thô (scan records)
  getAttendanceRecords: async (maSv) => {
    const response = await api.get(`/api/diem-danh/student/${encodeURIComponent(maSv)}`);
    return response.data.data;
  },

  // Thống kê điểm danh của sinh viên
  getAttendanceSummary: async (maSv) => {
    const response = await api.get(`/api/diem-danh/statistics/student/${encodeURIComponent(maSv)}`);
    return response.data.data;
  },
};

export default diemRenLuyenService;
