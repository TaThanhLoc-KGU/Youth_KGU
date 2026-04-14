import api from './api';

const cuocThiService = {
  // Public endpoints
  getDangMo: () => api.get('/api/public/cuoc-thi').then(r => r.data.data),
  getTatCa: () => api.get('/api/public/cuoc-thi/tat-ca').then(r => r.data.data),
  getBySlug: (slug) => api.get(`/api/public/cuoc-thi/slug/${slug}`).then(r => r.data.data),
  getById: (id) => api.get(`/api/public/cuoc-thi/${id}`).then(r => r.data.data),
  getByHoatDong: (ma) => api.get('/api/public/cuoc-thi/hoat-dong', { params: { ma } }).then(r => r.data.data),

  // Voting
  vote: (cuocThiId, thiSinhId, deviceId) =>
    api.post('/api/binh-chon', { cuocThiId, thiSinhId, deviceId }).then(r => r.data),
  kiemTraVote: (cuocThiId) =>
    api.get('/api/binh-chon/kiem-tra', { params: { cuocThiId } }).then(r => r.data.data),

  // Admin endpoints
  admin: {
    getAll: () => api.get('/api/cuoc-thi').then(r => r.data.data),
    getById: (id) => api.get(`/api/cuoc-thi/${id}`).then(r => r.data.data),
    getByHoatDong: (ma) => api.get('/api/cuoc-thi/hoat-dong', { params: { ma } }).then(r => r.data.data),
    create: (data) => api.post('/api/cuoc-thi', data).then(r => r.data.data),
    update: (id, data) => api.put(`/api/cuoc-thi/${id}`, data).then(r => r.data.data),
    delete: (id) => api.delete(`/api/cuoc-thi/${id}`).then(r => r.data),
    moVote: (id) => api.post(`/api/cuoc-thi/${id}/mo-vote`).then(r => r.data.data),
    dongVote: (id) => api.post(`/api/cuoc-thi/${id}/dong-vote`).then(r => r.data.data),
    congBo: (id) => api.post(`/api/cuoc-thi/${id}/cong-bo`).then(r => r.data.data),
    getThongKe: (id) => api.get(`/api/cuoc-thi/${id}/thong-ke`).then(r => r.data.data),
    addThiSinh: (id, data) => api.post(`/api/cuoc-thi/${id}/thi-sinh`, data).then(r => r.data.data),
    updateThiSinh: (id, tsId, data) => api.put(`/api/cuoc-thi/${id}/thi-sinh/${tsId}`, data).then(r => r.data.data),
    deleteThiSinh: (id, tsId) => api.delete(`/api/cuoc-thi/${id}/thi-sinh/${tsId}`).then(r => r.data),
    // Vote management
    getDanhSachVote: (id, page = 0, size = 20) =>
      api.get(`/api/cuoc-thi/${id}/danh-sach-vote`, { params: { page, size } }).then(r => r.data.data),
    exportVote: (id) =>
      api.get(`/api/cuoc-thi/${id}/export-vote`, { responseType: 'blob' }),
    checkoutWinners: (id, thiSinhIds) =>
      api.post(`/api/cuoc-thi/${id}/checkout-winners`, { thiSinhIds }).then(r => r.data.data),
    checkoutVoters: (id) =>
      api.post(`/api/cuoc-thi/${id}/checkout-voters`).then(r => r.data.data),
  },
};

export default cuocThiService;
