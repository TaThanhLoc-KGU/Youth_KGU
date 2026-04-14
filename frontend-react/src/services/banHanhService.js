import apiClient from './api';

const banHanhService = {
  /** Ban hành chính thức — POST /api/ky-so/ban-hanh/{maHoatDong} */
  banHanh: (maHoatDong, params) =>
    apiClient.post(`/api/ky-so/ban-hanh/${maHoatDong}`, params).then(r => r.data.data),

  /** Danh sách bản ban hành của hoạt động — GET /api/ky-so/ban-hanh/{maHoatDong} */
  getDanhSach: (maHoatDong) =>
    apiClient.get(`/api/ky-so/ban-hanh/${maHoatDong}`).then(r => r.data.data || []),

  /** Bản ban hành mới nhất (public) — GET /api/public/ban-hanh/{maHoatDong}/latest */
  getLatest: (maHoatDong) =>
    apiClient.get(`/api/public/ban-hanh/${maHoatDong}/latest`).then(r => r.data.data),

  /** Tất cả bản ban hành (public) */
  getAllPublic: (maHoatDong) =>
    apiClient.get(`/api/public/ban-hanh/all/${maHoatDong}`).then(r => r.data.data || []),

  /** Hủy ban hành — DELETE /api/ky-so/ban-hanh/{id} */
  huyBanHanh: (id) =>
    apiClient.delete(`/api/ky-so/ban-hanh/${id}`).then(r => r.data),

  /** URL download PDF — public, không cần token */
  getDownloadUrl: (id) => `/api/public/ban-hanh/${id}/download`,
};

export default banHanhService;
