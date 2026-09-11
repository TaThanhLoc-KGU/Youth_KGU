import api from './api';

const thongKeService = {
  // Thống kê tổng hợp 4 cụm — tự động scope theo khoa của người dùng
  getTongHop: async () => {
    const res = await api.get('/api/thong-ke/tong-hop');
    return res.data.data;
  },
};

export default thongKeService;
