import api from './api';
import { compressImage } from '../utils/imageCompress';

const doUpload = async (endpoint, file) => {
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append('file', compressed);
  const res = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.data?.url || res.data?.url || '';
};

const uploadService = {
  /** Upload ảnh media (slider, banner, bìa cuộc thi...) — admin/BCH */
  uploadMediaImage: (file) => doUpload('/api/admin/media/upload', file),

  /** Upload ảnh cho sinh viên nộp bài cuộc thi — chỉ cần đăng nhập */
  studentUpload: (file) => doUpload('/api/student/upload', file),

  /** Lấy danh sách ảnh media đã upload trên server */
  listMediaImages: async () => {
    const res = await api.get('/api/admin/media/images');
    return res.data?.data || [];
  },
};

export default uploadService;
