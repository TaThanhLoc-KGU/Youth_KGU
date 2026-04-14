import apiClient from './api';

const BASE = '/api/cau-hinh-email';

const emailConfigService = {
  /** Lấy cấu hình email hiện tại */
  getCauHinh: () => apiClient.get(BASE).then(r => r.data.data),

  /** Cập nhật cấu hình email */
  saveCauHinh: (dto) => apiClient.put(BASE, dto).then(r => r.data.data),

  /** Kiểm tra kết nối SMTP */
  testConnection: () => apiClient.post(`${BASE}/test`).then(r => r.data),
};

export default emailConfigService;
