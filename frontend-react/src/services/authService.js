import api from './api';

const authService = {
  // ─── JWT utilities (không cần gọi server) ───────────────────────────────

  decodeToken: (token) => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  },

  isTokenExpired: (token) => {
    if (!token) return true;
    const payload = authService.decodeToken(token);
    if (!payload?.exp) return true;
    // Thêm 5 giây buffer để tránh race condition
    return payload.exp * 1000 <= Date.now() + 5000;
  },

  getTokenExpiry: (token) => {
    const payload = authService.decodeToken(token);
    return payload?.exp ? payload.exp * 1000 : null;
  },

  // ─── Auth API ────────────────────────────────────────────────────────────

  // Login
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data.data;

    // Store tokens and user info
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    const user = response.data.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/api/auth/change-password', passwordData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (data) => {
    const response = await api.post('/api/auth/forgot-password', data);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    return response.data.data;
  },

  // Check if user is authenticated (token tồn tại, không cần valid ở đây — checkAuth xử lý)
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // Kiểm tra session còn hợp lệ không (cả access + refresh đều hết → false)
  isSessionValid: () => {
    const access  = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    if (!access) return false;
    // Access còn hạn → valid
    if (!authService.isTokenExpired(access)) return true;
    // Access hết nhưng refresh còn → có thể tự refresh → vẫn "valid"
    if (refresh && !authService.isTokenExpired(refresh)) return true;
    return false;
  },

  // Get stored user
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default authService;
