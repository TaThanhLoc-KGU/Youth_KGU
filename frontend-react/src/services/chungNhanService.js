import api from './api';

const BASE = '/api/chung-nhan';
const TEMPLATE_BASE = '/api/chung-nhan-mau';

const chungNhanService = {
  getAll:          ()          => api.get(BASE).then(r => r.data.data || []),
  getById:         (id)        => api.get(`${BASE}/${id}`).then(r => r.data.data),
  getByStudent:    (maSv)      => api.get(`${BASE}/student/${maSv}`).then(r => r.data.data || []),
  getByActivity:   (maHoatDong)=> api.get(`${BASE}/activity/${maHoatDong}`).then(r => r.data.data || []),
  issueAuto:       (maSv, maHoatDong, templateId) => api.post(`${BASE}/issue/auto`, null, { params: { maSv, maHoatDong, templateId } }).then(r => r.data),
  issueManual:     (dto)       => api.post(`${BASE}/issue/manual`, dto).then(r => r.data),
  issueBulk:       (maHoatDong, templateId) => api.post(`${BASE}/issue/bulk/${encodeURIComponent(maHoatDong)}`, null, { params: { templateId } }).then(r => r.data),
  revoke:          (id, lyDo)  => api.post(`${BASE}/${id}/revoke`, null, { params: { lyDo } }).then(r => r.data),
  preview:         (payload)   => api.post(`${BASE}/preview`, payload).then(r => r.data.data),

  // ── Mẫu chứng nhận ──────────────────────────────────────────────────────────
  getTemplates:    ()          => api.get(TEMPLATE_BASE).then(r => r.data.data || []),
  getTemplate:     (id)        => api.get(`${TEMPLATE_BASE}/${id}`).then(r => r.data.data),
  createTemplate:  (ten, hinhNen, fields) => {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify({ ten, fields })], { type: 'application/json' }));
    form.append('hinhNen', hinhNen);
    // Instance axios (api.js) đặt default header Content-Type: application/json cho MỌI request
    // → phải ghi đè thủ công thành multipart/form-data, nếu không axios sẽ không tự nhận diện
    // FormData và gửi sai Content-Type (giống cách kySoService.uploadChuKy đã làm).
    return api.post(TEMPLATE_BASE, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data);
  },
  updateTemplate:  (id, ten, hinhNenMoi, fields) => {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify({ ten, fields })], { type: 'application/json' }));
    if (hinhNenMoi) form.append('hinhNen', hinhNenMoi);
    return api.put(`${TEMPLATE_BASE}/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data);
  },
  deleteTemplate:  (id)        => api.delete(`${TEMPLATE_BASE}/${id}`).then(r => r.data),
};

export default chungNhanService;
