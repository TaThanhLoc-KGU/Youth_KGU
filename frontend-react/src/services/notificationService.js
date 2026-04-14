import api from './api';

const notificationService = {
  getNotifications: () => api.get('/api/notifications'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markAsRead: (id) => api.post(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
  
  // SSE stream
  getStreamUrl: () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const token = localStorage.getItem('accessToken');
    return `${baseUrl}/api/notifications/stream?token=${token}`;
  }
};

export default notificationService;
