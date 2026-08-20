import api from './api';

const newsService = {
  // ── Public ──────────────────────────────────────────────────────────────────

  /** Resolve một path URL → { type, post, category, posts, redirectTo } */
  resolve: async (path) => {
    const response = await api.get('/api/public/resolve', {
      params: { path },
    });
    return response.data;
  },

  /** Danh sách bài viết PUBLISHED cho public */
  getDanhSach: async (params = {}) => {
    const response = await api.get('/api/public/news', { params });
    return response.data;
  },

  /** Cây danh mục cho mega menu */
  getCayDanhMuc: async () => {
    const response = await api.get('/api/public/chuyen-muc/tree');
    return response.data;
  },

  /**
   * Upload ảnh chung (không gán ID bài viết ngay).
   * Trả về { url: "..." }
   */
  uploadImage: async (formData) => {
    const response = await api.post('/api/news/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = response.data;
    // Normalize: backend có thể trả về { url }, { fileUrl }, hay string trực tiếp
    const url = typeof data === 'string'
      ? data
      : (data?.url || data?.fileUrl || data?.data?.url || null);
    return { url };
  },

  /** Tạo bài đăng mới (DRAFT) */
  create: async (data) => {
    const response = await api.post('/api/news', data);
    return response.data;
  },

  /** Danh sách bài của đơn vị mình (admin thấy tất cả) */
  getDanhSachManage: async (params = {}) => {
    const response = await api.get('/api/news', { params });
    return response.data;
  },

  /** Chi tiết bài viết (manage) */
  getById: async (id) => {
    const response = await api.get(`/api/news/${id}`);
    return response.data;
  },

  /** Sửa bài viết */
  update: async (id, data) => {
    const response = await api.put(`/api/news/${id}`, data);
    return response.data;
  },

  /** Xóa mềm bài viết */
  delete: async (id) => {
    const response = await api.delete(`/api/news/${id}`);
    return response.data;
  },

  /** Publish bài viết (cần DUYET_TIN_TUC) */
  publish: async (id) => {
    const response = await api.post(`/api/news/${id}/publish`);
    return response.data;
  },

  /** Archive bài viết */
  archive: async (id) => {
    const response = await api.post(`/api/news/${id}/archive`);
    return response.data;
  },

  /** Liệt kê ảnh đã upload lên server (để chọn từ server trong editor) */
  getImages: async () => {
    const response = await api.get('/api/news/images');
    return response.data;
  },

  /**
   * Upload ảnh vào bài viết (nội dung hoặc đại diện).
   * Trả về URL string của ảnh đã upload.
   */
  uploadAnh: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/news/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Handle both { url } object and plain string response
    const data = response.data;
    return typeof data === 'string' ? data : (data.url || data.fileUrl || data);
  },

  /** Upload ảnh đại diện — alias của uploadAnh */
  uploadAnhDaiDien: async (id, file) => newsService.uploadAnh(id, file),

  /** Bài viết nổi bật (ghim / featured) */
  getNoiBat: async (size = 5) => {
    const response = await api.get('/api/public/news', {
      params: { isGhim: true, size, page: 0 },
    });
    return response.data;
  },

  /** Tìm văn bản để autocomplete khi tạo bài */
  searchVanBan: async (keyword) => {
    const response = await api.get('/api/news/van-ban/search', {
      params: { keyword },
    });
    return response.data;
  },

  // ── Tương tác: bình luận / thích / chia sẻ (public) ────────────────────────

  /** Danh sách bình luận công khai (chỉ HIEN) của 1 bài */
  getBinhLuan: async (tinTucId, params = {}) => {
    const response = await api.get(`/api/public/news/${tinTucId}/binh-luan`, { params });
    return response.data?.data;
  },

  /** Gửi bình luận mới. body: { noiDung, hoTen?, soDienThoai?, email? } */
  postBinhLuan: async (tinTucId, body) => {
    const response = await api.post(`/api/public/news/${tinTucId}/binh-luan`, body);
    return response.data?.data;
  },

  /** Trạng thái tương tác hiện tại (đã thích chưa, các bộ đếm, khóa bình luận) */
  getReactions: async (tinTucId, deviceId) => {
    const response = await api.get(`/api/public/news/${tinTucId}/reactions`, {
      params: deviceId ? { deviceId } : {},
    });
    return response.data?.data;
  },

  /** Toggle thích/bỏ thích */
  thich: async (tinTucId, deviceId) => {
    const response = await api.post(`/api/public/news/${tinTucId}/thich`, { deviceId });
    return response.data?.data;
  },

  /** Ghi nhận 1 lượt chia sẻ, trả về tổng lượt chia sẻ mới */
  chiaSe: async (tinTucId) => {
    const response = await api.post(`/api/public/news/${tinTucId}/chia-se`);
    return response.data?.data;
  },

  // ── Tương tác: kiểm duyệt bình luận (BCH/Admin — cần quyền KIEM_DUYET_BINH_LUAN) ──

  /** Toàn bộ bình luận (kể cả đã chặn/xóa) của 1 bài — dùng cho màn kiểm duyệt */
  getBinhLuanManage: async (tinTucId, params = {}) => {
    const response = await api.get(`/api/news/${tinTucId}/binh-luan`, { params });
    return response.data?.data;
  },

  chanBinhLuan: async (commentId) => {
    const response = await api.patch(`/api/news/binh-luan/${commentId}/chan`);
    return response.data;
  },

  boChanBinhLuan: async (commentId) => {
    const response = await api.patch(`/api/news/binh-luan/${commentId}/bo-chan`);
    return response.data;
  },

  xoaBinhLuan: async (commentId) => {
    const response = await api.delete(`/api/news/binh-luan/${commentId}`);
    return response.data;
  },

  /** Khóa/mở khóa bình luận cho 1 bài viết */
  khoaBinhLuan: async (tinTucId, khoa) => {
    const response = await api.patch(`/api/news/${tinTucId}/khoa-binh-luan`, null, { params: { khoa } });
    return response.data;
  },

  /**
   * Gửi thông báo broadcast đến toàn bộ người dùng đang hoạt động.
   * @param {string} title     - Tiêu đề thông báo
   * @param {string} message   - Nội dung thông báo
   * @param {string} type      - Loại: TIN_TUC | VAN_BAN | HOAT_DONG
   * @param {string} relatedId - ID bài/văn bản/hoạt động liên quan
   * @returns {Promise<number>} số người dùng đã nhận thông báo
   */
  broadcastNotification: async ({ title, message, type, relatedId }) => {
    const response = await api.post('/api/notifications/broadcast', {
      title,
      message,
      type,
      relatedId: relatedId != null ? String(relatedId) : null,
    });
    return response.data?.data ?? 0;
  },
};

export default newsService;
