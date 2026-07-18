import api from './api';

const BASE = '/api/chung-nhan';

const chungNhanService = {
  getAll:          ()          => api.get(BASE).then(r => r.data.data || []),
  getById:         (id)        => api.get(`${BASE}/${id}`).then(r => r.data.data),
  getByStudent:    (maSv)      => api.get(`${BASE}/student/${maSv}`).then(r => r.data.data || []),
  getByActivity:   (maHoatDong)=> api.get(`${BASE}/activity/${maHoatDong}`).then(r => r.data.data || []),
  issueAuto:       (maSv, maHoatDong) => api.post(`${BASE}/issue/auto`, null, { params: { maSv, maHoatDong } }).then(r => r.data),
  issueManual:     (dto)       => api.post(`${BASE}/issue/manual`, dto).then(r => r.data),
  issueBulk:       (maHoatDong)=> api.post(`${BASE}/issue/bulk/${encodeURIComponent(maHoatDong)}`).then(r => r.data),
  revoke:          (id, lyDo)  => api.post(`${BASE}/${id}/revoke`, null, { params: { lyDo } }).then(r => r.data),
};

export default chungNhanService;
