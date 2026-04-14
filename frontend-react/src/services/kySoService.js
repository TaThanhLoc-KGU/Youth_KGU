import api from './api';

const enc = (s) => encodeURIComponent(s);

const kySoService = {
  // ── Chữ ký ──────────────────────────────────────────────────────────────

  getAllChuKy: async () => {
    const res = await api.get('/api/ky-so/chu-ky');
    return res.data.data;
  },

  uploadChuKy: async (file, tenNguoiKy, chucVu, laMacDinh = false) => {
    const form = new FormData();
    form.append('file', file);
    form.append('tenNguoiKy', tenNguoiKy);
    if (chucVu) form.append('chucVu', chucVu);
    form.append('laMacDinh', laMacDinh);
    const res = await api.post('/api/ky-so/chu-ky', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  deleteChuKy: async (id) => {
    await api.delete(`/api/ky-so/chu-ky/${id}`);
  },

  // ── Con dấu ──────────────────────────────────────────────────────────────

  getAllConDau: async () => {
    const res = await api.get('/api/ky-so/con-dau');
    return res.data.data;
  },

  uploadConDau: async (file, ten, laMacDinh = false) => {
    const form = new FormData();
    form.append('file', file);
    form.append('ten', ten);
    form.append('laMacDinh', laMacDinh);
    const res = await api.post('/api/ky-so/con-dau', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  deleteConDau: async (id) => {
    await api.delete(`/api/ky-so/con-dau/${id}`);
  },

  // ── Preview ──────────────────────────────────────────────────────────────

  /**
   * Lấy ảnh preview (base64 PNG) từng trang của danh sách tham gia.
   * Nếu có override data, gửi POST để preview đúng nội dung đã chỉnh sửa.
   * @param {string} maHoatDong
   * @param {{ overrideRows?, overrideTieuDe?, overrideNgayStr? }} [overrides]
   * @returns {Promise<{pages: string[], pageWidthPt: number, pageHeightPt: number, totalStudents: number}>}
   */
  getPreview: async (maHoatDong, overrides = null) => {
    if (overrides) {
      const res = await api.post(`/api/ky-so/preview/${enc(maHoatDong)}`, overrides);
      return res.data.data;
    }
    const res = await api.get(`/api/ky-so/preview/${enc(maHoatDong)}`);
    return res.data.data;
  },

  // ── Xuất PDF ──────────────────────────────────────────────────────────────

  /**
   * Xuất PDF danh sách tham gia có ký số và bảo mật.
   * @param {string} maHoatDong
   * @param {object} params - {
   *   loaiKy, chuKyBiThuId, tenNguoiKy,
   *   chuKyNguoiLapId, tenNguoiLap, chucVuNguoiLap, conDauId,
   *   posBiThu, posNguoiLap, posConDau   ← { x, y, width, height } pixel trên ảnh preview
   * }
   */
  xuatPDF: async (maHoatDong, params) => {
    const body = {
      loaiKy:           params.loaiKy      || 'BÍ THƯ',
      chuKyBiThuId:     params.chuKyBiThuId    ?? null,
      tenNguoiKy:       params.tenNguoiKy   || '',
      chuKyNguoiLapId:  params.chuKyNguoiLapId ?? null,
      tenNguoiLap:      params.tenNguoiLap  || '',
      chucVuNguoiLap:   params.chucVuNguoiLap  ?? null,
      conDauId:         params.conDauId         ?? null,
      posBiThu:         params.posBiThu         ?? null,
      posNguoiLap:      params.posNguoiLap      ?? null,
      posConDau:        params.posConDau         ?? null,
    };

    const res = await api.post(
      `/api/ky-so/xuat-pdf/${enc(maHoatDong)}`,
      body,
      { responseType: 'blob' }
    );

    // Tạo link download
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_tham_gia_${maHoatDong}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── Lịch sử ký số ────────────────────────────────────────────────────────

  getLichSu: async (page = 0, size = 20) => {
    const res = await api.get(`/api/ky-so/lich-su?page=${page}&size=${size}`);
    return res.data.data; // Page<KySoLichSu>
  },

  getLichSuByHoatDong: async (maHoatDong) => {
    const res = await api.get(`/api/ky-so/lich-su/${enc(maHoatDong)}`);
    return res.data.data;
  },
};

export default kySoService;
