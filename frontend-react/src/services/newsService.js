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
