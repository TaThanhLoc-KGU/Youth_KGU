import api from './api';

const sliderService = {
  // Public — no auth required
  getActive: () => api.get('/api/public/slider').then((r) => r.data.data),

  // Admin — requires ADMIN role
  getAll:    ()        => api.get('/api/slider-items').then((r) => r.data.data),
  create:    (data)    => api.post('/api/slider-items', data).then((r) => r.data.data),
  update:    (id, data)=> api.put(`/api/slider-items/${id}`, data).then((r) => r.data.data),
  delete:    (id)      => api.delete(`/api/slider-items/${id}`),
  reorder:   (ids)     => api.put('/api/slider-items/reorder', ids),
};

export default sliderService;
