import api from './api';

const activityService = {
  getPublic: (params = {}) =>
    api.get('/api/hoat-dong/public', { params: { page: 0, size: 20, ...params } })
      .then(r => r.data.data ?? r.data),

  getById: (ma) =>
    api.get(`/api/hoat-dong/${ma}`).then(r => r.data.data),

  register: (maHoatDong) =>
    api.post(`/api/dang-ky-hoat-dong/${maHoatDong}`).then(r => r.data),

  unregister: (maHoatDong) =>
    api.delete(`/api/dang-ky-hoat-dong/${maHoatDong}`).then(r => r.data),

  getMyActivities: (params = {}) =>
    api.get('/api/dang-ky-hoat-dong/cua-toi', { params: { page: 0, size: 50, ...params } })
      .then(r => {
        const d = r.data.data ?? r.data;
        return Array.isArray(d) ? d : (d.content ?? []);
      }),

  selfScan: (qrCode) =>
    api.post('/api/diem-danh/self-scan', { qrCode }).then(r => r.data),
};

export default activityService;
