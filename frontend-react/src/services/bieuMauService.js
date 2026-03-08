import api from './api';

const bieuMauService = {
  // Public — no auth required
  getActive: () => api.get('/api/public/bieu-mau').then((r) => r.data.data),

  // Admin / BCH — requires ADMIN or BCH role
  getAll: () => api.get('/api/admin/bieu-mau').then((r) => r.data.data),

  create: ({ ten, thuTu = 0, isActive = true, file }) => {
    const fd = new FormData();
    fd.append('ten', ten);
    fd.append('thuTu', thuTu);
    fd.append('isActive', isActive);
    fd.append('file', file);
    return api.post('/api/admin/bieu-mau', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data);
  },

  updateMeta: (id, { ten, thuTu, isActive }) => {
    const fd = new FormData();
    fd.append('ten', ten);
    fd.append('thuTu', thuTu ?? 0);
    fd.append('isActive', isActive ?? true);
    return api.put(`/api/admin/bieu-mau/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data);
  },

  replaceFile: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.put(`/api/admin/bieu-mau/${id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data);
  },

  delete: (id) => api.delete(`/api/admin/bieu-mau/${id}`),
};

export default bieuMauService;
