import apiClient from './api';
import { publicApi } from './api';

const BASE = '/api/system-settings';

const systemSettingService = {
  /** Toàn bộ cài đặt (gom theo nhóm) — cần quyền CAI_DAT_HE_THONG */
  getAll: () => apiClient.get(BASE).then((r) => r.data.data),

  /** Cập nhật 1 cài đặt */
  update: (key, giaTri) =>
    apiClient.put(`${BASE}/${encodeURIComponent(key)}`, { giaTri }).then((r) => r.data.data),

  /** Các cài đặt công khai — dùng cho mọi người, kể cả chưa đăng nhập */
  getPublic: () => publicApi.get(`${BASE}/public`).then((r) => r.data.data),
};

export default systemSettingService;
