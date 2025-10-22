import api from './api';

const authService = {
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

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // Get stored user
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default authService;
