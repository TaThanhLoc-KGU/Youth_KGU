import api from './api';

// ──────────────────────────────────────────────────────────────────────────────
// Slider Items
// ──────────────────────────────────────────────────────────────────────────────
const sliderService = {
  getAll: () => api.get('/api/slider-items').then((r) => r.data.data),
  getActive: () => api.get('/api/public/slider').then((r) => r.data.data),
  create: (dto) => api.post('/api/slider-items', dto).then((r) => r.data.data),
  update: (id, dto) => api.put(`/api/slider-items/${id}`, dto).then((r) => r.data.data),
  delete: (id) => api.delete(`/api/slider-items/${id}`).then((r) => r.data.data),
  reorder: (ids) => api.put('/api/slider-items/reorder', ids).then((r) => r.data.data),
};

// ──────────────────────────────────────────────────────────────────────────────
// Ticker Items
// ──────────────────────────────────────────────────────────────────────────────
const tickerService = {
  getAll: () => api.get('/api/ticker-items').then((r) => r.data.data),
  getActive: () => api.get('/api/public/ticker').then((r) => r.data.data),
  create: (dto) => api.post('/api/ticker-items', dto).then((r) => r.data.data),
  update: (id, dto) => api.put(`/api/ticker-items/${id}`, dto).then((r) => r.data.data),
  delete: (id) => api.delete(`/api/ticker-items/${id}`).then((r) => r.data.data),
  reorder: (ids) => api.put('/api/ticker-items/reorder', ids).then((r) => r.data.data),
};

// ──────────────────────────────────────────────────────────────────────────────
// Ad Banners
// ──────────────────────────────────────────────────────────────────────────────
const adBannerService = {
  getAll: () => api.get('/api/ad-banners').then((r) => r.data.data),
  getActive: () => api.get('/api/public/ad-banners').then((r) => r.data.data),
  getActiveByLoai: (loai) =>
    api.get(`/api/public/ad-banners/loai/${loai}`).then((r) => r.data.data),
  create: (dto) => api.post('/api/ad-banners', dto).then((r) => r.data.data),
  update: (id, dto) => api.put(`/api/ad-banners/${id}`, dto).then((r) => r.data.data),
  delete: (id) => api.delete(`/api/ad-banners/${id}`).then((r) => r.data.data),
  reorder: (ids) => api.put('/api/ad-banners/reorder', ids).then((r) => r.data.data),
};

export { sliderService, tickerService, adBannerService };
export default { sliderService, tickerService, adBannerService };
