import api from './api';

const vanBanService = {
  // ── Public ──────────────────────────────────────────────────────────────────

  /** Danh sách văn bản PUBLISHED cho public */
  getDanhSach: async (params = {}) => {
    const response = await api.get('/api/public/van-ban', { params });
    return response.data;
  },

  /** Download file văn bản (blob) — tăng luotTai */
  taiVe: async (id) => {
    const response = await api.get(`/api/public/van-ban/${id}/tai-ve`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /** URL xem online trong iframe */
  getXemUrl: (id) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/public/van-ban/${id}/xem`,

  // ── Manage (cần JWT) ─────────────────────────────────────────────────────────

  /** Tạo văn bản mới + upload file (multipart) */
  create: async (dto, file) => {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    if (file) formData.append('file', file);
    const response = await api.post('/api/van-ban', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** Danh sách tất cả văn bản (kể cả DRAFT) cho trang quản lý */
  getDanhSachManage: async (params = {}) => {
    const response = await api.get('/api/van-ban', { params });
    return response.data;
  },

  /** Chi tiết văn bản */
  getById: async (id) => {
    const response = await api.get(`/api/van-ban/${id}`);
    return response.data;
  },

  /** Sửa metadata văn bản (VB-001: chỉ khi DRAFT) */
  update: async (id, data) => {
    const response = await api.put(`/api/van-ban/${id}`, data);
    return response.data;
  },

  /** Xóa mềm văn bản */
  delete: async (id) => {
    const response = await api.delete(`/api/van-ban/${id}`);
    return response.data;
  },

  /** Ban hành chính thức (VB-001: sau đó bất biến) */
  publish: async (id) => {
    const response = await api.post(`/api/van-ban/${id}/publish`);
    return response.data;
  },

  /** Thay thế file (VB-001 + VB-002: chỉ khi DRAFT, xóa file cũ) */
  replaceFile: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.put(`/api/van-ban/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default vanBanService;
