import axios from 'axios';
import { toast } from 'react-toastify';

// Get base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Crucial for Cookie-based sessions
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401, not a login request, and not already retrying
    if (
      error.response?.status === 401 &&
      originalRequest.url !== '/api/auth/login' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user completely
        localStorage.clear(); // Nuclear option
        window.location.href = '/login?expired=true';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi';

    // Không toast cho:
    //   401 - đã xử lý redirect ở trên
    //   403 - không có quyền, UI đã ẩn/disable nút bằng hasPermission(); toast ở đây chỉ spam
    // Chỉ toast cho lỗi thực sự: 400 Bad Request, 404, 5xx, network error
    const shouldToast =
      status !== 401 &&
      status !== 403 &&
      error.config?.url !== '/api/auth/login';

    if (shouldToast) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;

// Export base URL for use in components
export { API_BASE_URL };
