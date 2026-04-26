import api from './api';

const enc = (s) => encodeURIComponent(s);

const cauLacBoService = {
  // ── CLB ────────────────────────────────────────────────────────
  getAll: async (params = {}) => {
    const res = await api.get('/api/clb', { params });
    return res.data.data || [];
  },

  getDetail: async (maClb) => {
    const res = await api.get(`/api/clb/${enc(maClb)}`);
    return res.data.data;
  },

  create: async (data) => {
    const res = await api.post('/api/clb', data);
    return res.data.data;
  },

  update: async (maClb, data) => {
    const res = await api.put(`/api/clb/${enc(maClb)}`, data);
    return res.data.data;
  },

  delete: async (maClb) => {
    const res = await api.delete(`/api/clb/${enc(maClb)}`);
    return res.data;
  },

  // ── Thành viên ─────────────────────────────────────────────────
  getThanhVien: async (maClb, maHocKy = null) => {
    const params = maHocKy ? { maHocKy } : {};
    const res = await api.get(`/api/clb/${enc(maClb)}/thanh-vien`, { params });
    return res.data.data || [];
  },

  addThanhVien: async (maClb, data) => {
    const res = await api.post(`/api/clb/${enc(maClb)}/thanh-vien`, data);
    return res.data.data;
  },

  updateThanhVien: async (maClb, id, data) => {
    const res = await api.put(`/api/clb/${enc(maClb)}/thanh-vien/${id}`, data);
    return res.data.data;
  },

  removeThanhVien: async (maClb, id) => {
    const res = await api.delete(`/api/clb/${enc(maClb)}/thanh-vien/${id}`);
    return res.data;
  },

  // ── Hoạt động ──────────────────────────────────────────────────
  getHoatDong: async (maClb, maNamHoc = null) => {
    const params = maNamHoc ? { maNamHoc } : {};
    const res = await api.get(`/api/clb/${enc(maClb)}/hoat-dong`, { params });
    return res.data.data || [];
  },

  // ── Tư cách thành viên (sinh viên) ────────────────────────────
  getMyMembership: async () => {
    const res = await api.get('/api/clb/my-membership');
    return res.data.data || [];
  },

  // ── CLB của tôi (chủ nhiệm CLB) ────────────────────────────────
  getMyClubs: async () => {
    const res = await api.get('/api/clb/my-clubs');
    return res.data.data || [];
  },

  // ── Khóa/mở khóa danh sách theo học kỳ ────────────────────────
  lockHocKy: async (maHocKy, locked = true) => {
    const res = await api.put(`/api/clb/lock-hoc-ky/${enc(maHocKy)}`, null, { params: { locked } });
    return res.data;
  },

  // ── Đóng phí CLB ───────────────────────────────────────────────
  getPhi: async (maClb, maHocKy = null) => {
    const params = maHocKy ? { maHocKy } : {};
    const res = await api.get(`/api/clb/${enc(maClb)}/phi`, { params });
    return res.data.data || [];
  },

  getPhiStats: async (maClb, maHocKy = null) => {
    const params = maHocKy ? { maHocKy } : {};
    const res = await api.get(`/api/clb/${enc(maClb)}/phi/stats`, { params });
    return res.data.data || {};
  },

  generatePhi: async (maClb, maHocKy, soTien = 50000) => {
    const res = await api.post(`/api/clb/${enc(maClb)}/phi/generate`, null,
      { params: { maHocKy, soTien } });
    return res.data;
  },

  markDaDong: async (maClb, id, hinhThuc = 'TIEN_MAT', ghiChu = null) => {
    const params = { hinhThuc, ...(ghiChu ? { ghiChu } : {}) };
    const res = await api.put(`/api/clb/${enc(maClb)}/phi/${id}/da-dong`, null, { params });
    return res.data.data;
  },

  markMienGiam: async (maClb, id, ghiChu = null) => {
    const params = ghiChu ? { ghiChu } : {};
    const res = await api.put(`/api/clb/${enc(maClb)}/phi/${id}/mien-giam`, null, { params });
    return res.data.data;
  },

  resetChuaDong: async (maClb, id) => {
    const res = await api.put(`/api/clb/${enc(maClb)}/phi/${id}/reset`);
    return res.data.data;
  },

  // ── Cấu hình CLB ───────────────────────────────────────────
  getCauHinh: async (maClb) => {
    const res = await api.get(`/api/clb/${enc(maClb)}/cau-hinh`);
    return res.data.data || {};
  },

  saveCauHinh: async (maClb, data) => {
    const res = await api.put(`/api/clb/${enc(maClb)}/cau-hinh`, data);
    return res.data.data;
  },

  // ── Đăng ký thành viên (BCN) ───────────────────────────────
  getDonDangKy: async (maClb, trangThai = null) => {
    const params = trangThai ? { trangThai } : {};
    const res = await api.get(`/api/clb/${enc(maClb)}/dang-ky`, { params });
    return res.data.data || [];
  },

  countCHO_DUYET: async (maClb) => {
    const res = await api.get(`/api/clb/${enc(maClb)}/dang-ky/count`);
    return res.data.data || 0;
  },

  duyetDon: async (maClb, id, lyDo = null) => {
    const params = lyDo ? { lyDo } : {};
    const res = await api.put(`/api/clb/${enc(maClb)}/dang-ky/${id}/duyet`, null, { params });
    return res.data.data;
  },

  tuChoiDon: async (maClb, id, lyDo = null) => {
    const params = lyDo ? { lyDo } : {};
    const res = await api.put(`/api/clb/${enc(maClb)}/dang-ky/${id}/tu-choi`, null, { params });
    return res.data.data;
  },

  // ── Đăng ký thành viên (Sinh viên) ────────────────────────
  submitDangKy: async (maClb, lyDo = null) => {
    const res = await api.post(`/api/clb/${enc(maClb)}/dang-ky`, { lyDo });
    return res.data.data;
  },

  huyDon: async (maClb, id) => {
    const res = await api.put(`/api/clb/${enc(maClb)}/dang-ky/${id}/huy`);
    return res.data.data;
  },

  getMyDangKy: async () => {
    const res = await api.get('/api/clb/my-dang-ky');
    return res.data.data || [];
  },

  // ── Export Excel ────────────────────────────────────────────
  exportMembers: async (maClb, maHocKy = null) => {
    const params = maHocKy ? { maHocKy } : {};
    const res = await api.get(`/api/clb/${enc(maClb)}/export-members`, {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement('a');
    a.href    = url;
    const cd  = res.headers['content-disposition'] || '';
    const match = cd.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
    a.download = match ? decodeURIComponent(match[1]) : `thanh-vien-${maClb}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

export default cauLacBoService;
