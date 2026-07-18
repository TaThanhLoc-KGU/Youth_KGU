import api from './api';

const enc = (s) => encodeURIComponent(s);

const clbBanHanhService = {
  /** Xem trước PDF danh sách thành viên CLB. */
  preview: async (maClb, body) => {
    const res = await api.post(`/api/clb/${enc(maClb)}/ban-hanh/preview`, body);
    return res.data.data;
  },

  /** Ban hành chính thức, trả về DanhSachBanHanhDTO. */
  banHanh: async (maClb, body) => {
    const res = await api.post(`/api/clb/${enc(maClb)}/ban-hanh`, body);
    return res.data.data;
  },

  /** Lấy danh sách các phiên bản ban hành của CLB. */
  getDanhSach: async (maClb) => {
    const res = await api.get(`/api/clb/${enc(maClb)}/ban-hanh`);
    return res.data.data;
  },

  /** Hủy một phiên bản ban hành (soft-delete). */
  huyBanHanh: async (maClb, id) => {
    await api.delete(`/api/clb/${enc(maClb)}/ban-hanh/${id}`);
  },

  /** Tải PDF ban hành về máy. */
  downloadPDF: (maClb, id, tenFile) => {
    const url = `/api/clb/${enc(maClb)}/ban-hanh/${id}/download`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', tenFile || `clb_${maClb}_ban_hanh.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export default clbBanHanhService;
