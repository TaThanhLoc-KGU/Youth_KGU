import api from './api';

const adBannerService = {
  // Public — no auth required
  getActive:       ()       => api.get('/api/public/ad-banners').then((r) => r.data.data),
  getActiveByLoai: (loai)   => api.get(`/api/public/ad-banners/loai/${loai}`).then((r) => r.data.data),

  // Admin — requires ADMIN role
  getAll:     ()         => api.get('/api/ad-banners').then((r) => r.data.data),
  create:     (data)     => api.post('/api/ad-banners', data).then((r) => r.data.data),
  update:     (id, data) => api.put(`/api/ad-banners/${id}`, data).then((r) => r.data.data),
  delete:     (id)       => api.delete(`/api/ad-banners/${id}`),
  reorder:    (ids)      => api.put('/api/ad-banners/reorder', ids),
  /** Kích hoạt duy nhất một banner trong cùng loại (tắt tất cả loại đó trước) */
  activate:   (id)       => api.put(`/api/ad-banners/${id}/activate`).then((r) => r.data.data),
  /** Tắt hiển thị banner này (không kích hoạt cái khác) */
  deactivate: (id)       => api.put(`/api/ad-banners/${id}/deactivate`).then((r) => r.data.data),
};

export default adBannerService;
