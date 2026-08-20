import api from './api';

const gopYService = {
  // ── Sinh viên (cần đăng nhập) ──────────────────────────────────────────────

  /** Gửi góp ý/phản ánh mới. data: { tieuDe, noiDung, loai } */
  submit: async (data) => {
    const response = await api.post('/api/public/gop-y', data);
    return response.data?.data;
  },

  /** Lịch sử góp ý của chính mình */
  getMySubmissions: async (params = {}) => {
    const response = await api.get('/api/public/gop-y/cua-toi', { params });
    return response.data?.data;
  },

  /** Chi tiết 1 góp ý của chính mình */
  getMySubmission: async (id) => {
    const response = await api.get(`/api/public/gop-y/cua-toi/${id}`);
    return response.data?.data;
  },

  // ── Admin / BCH (cần quyền XEM_GOP_Y / XU_LY_GOP_Y) ─────────────────────────

  /** Danh sách góp ý cho admin — ẩn danh, không có thông tin người gửi */
  getAllAdmin: async (params = {}) => {
    const response = await api.get('/api/gop-y-manage', { params });
    return response.data?.data;
  },

  getDetailAdmin: async (id) => {
    const response = await api.get(`/api/gop-y-manage/${id}`);
    return response.data?.data;
  },

  /** Phản hồi + đổi trạng thái. data: { phanHoi, trangThai } */
  respond: async (id, data) => {
    const response = await api.patch(`/api/gop-y-manage/${id}/phan-hoi`, data);
    return response.data?.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/api/gop-y-manage/${id}`);
    return response.data;
  },
};

export default gopYService;
