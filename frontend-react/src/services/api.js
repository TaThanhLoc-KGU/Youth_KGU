import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

// ─── Session expired handler ─────────────────────────────────────────────────
// Được set từ App.jsx để tránh circular dependency (api → authStore → authService → api)
let _onSessionExpired = null;

export const registerSessionExpiredHandler = (handler) => {
  _onSessionExpired = handler;
};

const handleSessionExpired = () => {
  // Xóa tokens khỏi localStorage (surgical, không xóa toàn bộ localStorage)
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('lastActiveTime');

  if (_onSessionExpired) {
    _onSessionExpired();
  } else {
    // Fallback nếu handler chưa được đăng ký
    window.location.href = '/login?expired=true';
  }
};

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ────────────────────────────────────────────────────
let _isRefreshing = false;
let _refreshQueue = []; // requests waiting for token refresh

const processRefreshQueue = (error, token = null) => {
  _refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  _refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 trên login → không refresh, throw thẳng
    if (originalRequest.url === '/api/auth/login') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang refresh rồi → xếp hàng chờ
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        processRefreshQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processRefreshQueue(refreshError);
        // Token hết hạn hoàn toàn → buộc logout
        handleSessionExpired();
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    // Lỗi khác — chỉ toast cho lỗi thực sự (không spam 401/403)
    const status = error.response?.status;
    const shouldToast =
      status !== 401 &&
      status !== 403 &&
      originalRequest.url !== '/api/auth/login';

    if (shouldToast) {
      const message = error.response?.data?.message || error.message || 'Đã xảy ra lỗi';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
