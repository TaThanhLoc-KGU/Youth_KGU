import api from './api';

/** "Nhập khóa mới" — nạp trực tiếp file export sinh viên từ hệ thống nhà trường. */
const nhapKhoaMoiService = {
  preview: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/nhap-khoa-moi/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // khoaChoNganhMoi: { [tenNganhGoiY]: maKhoa }, maNganhChoNganhMoi: { [tenNganhGoiY]: maNganh } (tùy chọn)
  confirm: async (file, khoaChoNganhMoi, maNganhChoNganhMoi) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('khoaChoNganhMoiJson', JSON.stringify(khoaChoNganhMoi || {}));
    formData.append('maNganhChoNganhMoiJson', JSON.stringify(maNganhChoNganhMoi || {}));
    const res = await api.post('/api/nhap-khoa-moi/confirm', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  danhSachKhoa: async () => {
    const res = await api.get('/api/nhap-khoa-moi/khoa');
    return res.data.data;
  },
};

export default nhapKhoaMoiService;
