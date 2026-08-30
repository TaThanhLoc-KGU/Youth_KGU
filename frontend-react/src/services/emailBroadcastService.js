import api from './api';

const emailBroadcastService = {
  // ── Nhóm mail ────────────────────────────────────────────────────────────
  getGroups: async () => (await api.get('/api/email-group')).data?.data,

  /** data: { tenNhom, diaChiEmail, maKhoa } */
  createGroup: async (data) => (await api.post('/api/email-group', data)).data?.data,
  updateGroup: async (id, data) => (await api.put(`/api/email-group/${id}`, data)).data?.data,
  deleteGroup: async (id) => (await api.delete(`/api/email-group/${id}`)).data,

  // ── Mẫu email ────────────────────────────────────────────────────────────
  getTemplates: async () => (await api.get('/api/email-template')).data?.data,

  /** data: { tenMau, tieuDe, noiDung } */
  createTemplate: async (data) => (await api.post('/api/email-template', data)).data?.data,
  updateTemplate: async (id, data) => (await api.put(`/api/email-template/${id}`, data)).data?.data,
  deleteTemplate: async (id) => (await api.delete(`/api/email-template/${id}`)).data,

  // ── Gửi ──────────────────────────────────────────────────────────────────
  /** data: { groupIds: [], extraEmails: [], subject, body } */
  send: async (data) => (await api.post('/api/email-broadcast/send', data)).data?.data,
};

export default emailBroadcastService;
