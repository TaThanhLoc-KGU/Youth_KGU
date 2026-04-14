import api from './api';

const uploadService = {
  /**
   * Upload một ảnh media (slider, banner, ...).
   * @param {File} file - file ảnh từ input
   * @returns {Promise<string>} URL tương đối của ảnh đã upload
   */
  uploadMediaImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/admin/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data?.url || res.data?.url || '';
  },

  /**
   * Lấy danh sách ảnh media đã upload trên server.
   * @returns {Promise<string[]>} Danh sách URL tương đối
   */
  listMediaImages: async () => {
    const res = await api.get('/api/admin/media/images');
    return res.data?.data || [];
  },
};

export default uploadService;
