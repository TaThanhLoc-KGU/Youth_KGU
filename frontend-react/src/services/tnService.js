import api from './api';

const unwrap = (r) => r.data.data;

/** API tính năng "Thi trắc nghiệm trực tuyến". */
const tnService = {
  // ============ NGÂN HÀNG CÂU HỎI (admin) ============
  cauHoi: {
    search: (params = {}) => api.get('/api/tn/cau-hoi', { params }).then((r) => r.data.data),
    get: (id) => api.get(`/api/tn/cau-hoi/${id}`).then(unwrap),
    create: (body) => api.post('/api/tn/cau-hoi', body).then(unwrap),
    update: (id, body) => api.put(`/api/tn/cau-hoi/${id}`, body).then(unwrap),
    remove: (id) => api.delete(`/api/tn/cau-hoi/${id}`),
    danhMuc: () => api.get('/api/tn/cau-hoi/danh-muc').then(unwrap),
    createDanhMuc: (body) => api.post('/api/tn/cau-hoi/danh-muc', body).then(unwrap),
  },

  // ============ ĐỀ THI (admin) ============
  deThi: {
    list: (params = {}) => api.get('/api/tn/de-thi', { params }).then((r) => r.data.data),
    get: (id) => api.get(`/api/tn/de-thi/${id}`).then(unwrap),
    create: (body) => api.post('/api/tn/de-thi', body).then(unwrap),
    update: (id, body) => api.put(`/api/tn/de-thi/${id}`, body).then(unwrap),
    doiTrangThai: (id, trangThai) =>
      api.patch(`/api/tn/de-thi/${id}/trang-thai`, { trangThai }).then(unwrap),
    remove: (id) => api.delete(`/api/tn/de-thi/${id}`),
  },

  // ============ LÀM BÀI (thí sinh) ============
  thi: {
    batDau: (deThiId) => api.post(`/api/tn/thi/de/${deThiId}/bat-dau`).then(unwrap),
    autoSave: (luotThiId, cauHoiId, traLoi, danhDau) =>
      api.put(`/api/tn/thi/luot/${luotThiId}/cau-hoi/${cauHoiId}`, { traLoi, danhDau }).then(unwrap),
    nop: (luotThiId) => api.post(`/api/tn/thi/luot/${luotThiId}/nop`).then(unwrap),
    ketQua: (luotThiId) => api.get(`/api/tn/thi/luot/${luotThiId}/ket-qua`).then(unwrap),
    deThiKhaDung: () => api.get('/api/tn/thi/de-thi').then(unwrap),
    lichSu: () => api.get('/api/tn/thi/lich-su').then(unwrap),
  },
};

export const DO_KHO = [
  { value: 'DE', label: 'Dễ' },
  { value: 'TRUNG_BINH', label: 'Trung bình' },
  { value: 'KHO', label: 'Khó' },
];
export const LOAI_CAU_HOI = [
  { value: 'MOT_DAP_AN', label: 'Một đáp án đúng' },
  { value: 'NHIEU_DAP_AN', label: 'Nhiều đáp án đúng' },
  { value: 'DUNG_SAI', label: 'Đúng / Sai' },
];

export default tnService;
