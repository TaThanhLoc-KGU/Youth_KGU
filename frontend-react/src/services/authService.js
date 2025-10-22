import api from './api';

const authService = {
  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      
      // Log toàn bộ response để debug
      console.log('🔍 Full login response:', response);
      console.log('🔍 Response data:', response.data);
      
      // Xử lý nhiều cấu trúc response khác nhau
      let responseData = response.data;
      
      // Nếu có wrapper .data
      if (responseData.data) {
        responseData = responseData.data;
      }
      
      // Lấy tokens - hỗ trợ cả camelCase và snake_case
      const accessToken = responseData.accessToken || responseData.access_token;
      const refreshToken = responseData.refreshToken || responseData.refresh_token;
      const user = responseData.user;
      
      // Log để kiểm tra
      console.log('✅ Access Token:', accessToken);
      console.log('✅ Refresh Token:', refreshToken);
      console.log('✅ User:', user);
      
      // Validate trước khi lưu
      if (!accessToken) {
        console.error('❌ Access token không tồn tại trong response!');
        console.error('📋 Response structure:', JSON.stringify(responseData, null, 2));
        throw new Error('Access token not found in response');
      }
      
      if (!refreshToken) {
        console.error('❌ Refresh token không tồn tại trong response!');
      }
      
      // Store tokens and user info
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Verify đã lưu thành công
      console.log('💾 Đã lưu vào localStorage:');
      console.log('  - accessToken:', localStorage.getItem('accessToken'));
      console.log('  - refreshToken:', localStorage.getItem('refreshToken'));
      
      return { accessToken, refreshToken, user };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('📋 Error response:', error.response?.data);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
      console.log('✅ Logout API call successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      console.log('🧹 Đã xóa tất cả tokens khỏi localStorage');
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      console.log('✅ Register response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      const user = response.data.data || response.data;
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ Current user:', user);
      return user;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/api/auth/change-password', passwordData);
      console.log('✅ Password changed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Change password error:', error);
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (data) => {
    try {
      const response = await api.post('/api/auth/forgot-password', data);
      console.log('✅ Forgot password request sent');
      return response.data;
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/api/auth/refresh', { refreshToken });
      
      console.log('🔍 Refresh token response:', response.data);
      
      let responseData = response.data;
      if (responseData.data) {
        responseData = responseData.data;
      }
      
      // Hỗ trợ cả camelCase và snake_case
      const accessToken = responseData.accessToken || responseData.access_token;
      const newRefreshToken = responseData.refreshToken || responseData.refresh_token || refreshToken;
      
      if (!accessToken) {
        throw new Error('Access token not found in refresh response');
      }
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      console.log('✅ Tokens refreshed successfully');
      
      return { accessToken, refreshToken: newRefreshToken };
      
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      // Nếu refresh token fail, clear localStorage và redirect to login
      this.logout();
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const hasToken = !!localStorage.getItem('accessToken');
    console.log('🔐 Is authenticated:', hasToken);
    return hasToken;
  },

  // Get stored user
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('👤 Stored user:', user);
    return user;
  },

  // Get access token
  getAccessToken: () => {
    return localStorage.getItem('accessToken');
  },

  // Get refresh token
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  // Debug: Hiển thị tất cả tokens
  debugTokens: () => {
    console.log('🐛 DEBUG - Current tokens in localStorage:');
    console.log('  - accessToken:', localStorage.getItem('accessToken'));
    console.log('  - refreshToken:', localStorage.getItem('refreshToken'));
    console.log('  - user:', localStorage.getItem('user'));
  },
};

export default authService;