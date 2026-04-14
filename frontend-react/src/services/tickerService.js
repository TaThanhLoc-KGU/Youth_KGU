import api from './api';

const tickerService = {
  // Public — no auth required
  getActive: () => api.get('/api/public/ticker').then((r) => r.data.data),

  // Admin — requires ADMIN role
  getAll:    ()         => api.get('/api/ticker-items').then((r) => r.data.data),
  create:    (data)     => api.post('/api/ticker-items', data).then((r) => r.data.data),
  update:    (id, data) => api.put(`/api/ticker-items/${id}`, data).then((r) => r.data.data),
  delete:    (id)       => api.delete(`/api/ticker-items/${id}`),
  reorder:   (ids)      => api.put('/api/ticker-items/reorder', ids),
};

export default tickerService;
