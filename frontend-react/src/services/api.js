import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080', // Thay đổi nếu cần
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token vào mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    
    console.log('🚀 Request interceptor:');
    console.log('  - URL:', config.url);
    console.log('  - Method:', config.method);
    console.log('  - Token:', token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('  ✅ Added Authorization header:', config.headers.Authorization);
    } else {
      console.log('  ❌ No token found in localStorage!');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ Response error:', error.response?.status, error.config?.url);
    
    // Nếu lỗi 401 (Unauthorized) và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.log('⚠️ No refresh token, redirecting to login...');
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        console.log('🔄 Attempting to refresh token...');
        
        // Call refresh token API
        const response = await axios.post('http://localhost:8080/api/auth/refresh', {
          refreshToken: refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
        
        // Update tokens
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        console.log('✅ Token refreshed successfully');
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Refresh token failed:', refreshError);
        
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;