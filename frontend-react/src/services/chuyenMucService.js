import api from './api';

const chuyenMucService = {
  // ── Public ──────────────────────────────────────────────────────────────────

  /** Cây danh mục đầy đủ */
  getTree: async () => {
    const response = await api.get('/api/public/chuyen-muc/tree');
    return response.data;
  },

  // ── Manage (cần JWT + QUAN_LY_CHUYEN_MUC) ────────────────────────────────────

  /** Danh sách tất cả chuyên mục dạng flat (cho dropdown) */
  getAll: async () => {
    const response = await api.get('/api/news/chuyen-muc');
    return response.data;
  },

  /** Tạo danh mục mới */
  create: async (data) => {
    const response = await api.post('/api/news/chuyen-muc', data);
    return response.data;
  },

  /** Sửa danh mục (CM-001: cascade recalculate slug + url_redirect) */
  update: async (id, data) => {
    const response = await api.put(`/api/news/chuyen-muc/${id}`, data);
    return response.data;
  },

  /** Xóa mềm danh mục (CM-002: chặn nếu còn nội dung) */
  delete: async (id) => {
    const response = await api.delete(`/api/news/chuyen-muc/${id}`);
    return response.data;
  },
};

export default chuyenMucService;
