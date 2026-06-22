import api from './api';

const newsService = {
  getList: (params = {}) =>
    api.get('/api/bai-viet', { params: { page: 0, size: 20, trangThai: 'DA_DANG', ...params } })
      .then(r => r.data.data ?? r.data),

  getBySlug: (slug) =>
    api.get(`/api/bai-viet/${slug}`).then(r => r.data.data),

  getByCategory: (slug, params = {}) =>
    api.get('/api/bai-viet', {
      params: { page: 0, size: 20, trangThai: 'DA_DANG', chuyenMucSlug: slug, ...params },
    }).then(r => r.data.data ?? r.data),

  getCategories: () =>
    api.get('/api/chuyen-muc').then(r => r.data.data ?? []),

  getFeatured: () =>
    api.get('/api/bai-viet', { params: { page: 0, size: 5, trangThai: 'DA_DANG', sort: 'ngayXuatBan,desc' } })
      .then(r => {
        const d = r.data.data ?? r.data;
        return Array.isArray(d) ? d : (d.content ?? []);
      }),

  getPopular: () =>
    api.get('/api/bai-viet', { params: { page: 0, size: 10, trangThai: 'DA_DANG', sort: 'luotXem,desc' } })
      .then(r => {
        const d = r.data.data ?? r.data;
        return Array.isArray(d) ? d : (d.content ?? []);
      }),
};

export default newsService;
