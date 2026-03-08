import api from './api';

// ── Helpers cho Web Push ─────────────────────────────────────────────────────

/**
 * Chuyển VAPID public key (Base64url) sang Uint8Array mà Push API cần.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Đăng ký service worker + yêu cầu push permission + lưu subscription lên server.
 * Trả về: 'subscribed' | 'denied' | 'unsupported' | 'error'
 */
async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported';
  }

  // Yêu cầu quyền thông báo từ trình duyệt
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  try {
    // Lấy VAPID public key từ server
    const keyRes = await api.get('/api/push/vapid-public-key');
    const vapidKey = keyRes.data.data;

    // Đăng ký service worker nếu chưa có
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // Subscribe vào Push API
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // Lấy keys từ subscription object
    const subJson = sub.toJSON();
    const deviceInfo = `${navigator.userAgent.substring(0, 80)}`;

    // Lưu subscription lên server
    await api.post('/api/push/subscribe', {
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
      deviceInfo,
    });

    return 'subscribed';
  } catch (err) {
    console.error('[Push] Subscribe error:', err);
    return 'error';
  }
}

/**
 * Hủy đăng ký push notification và thông báo server.
 */
async function unsubscribePush() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await api.delete('/api/push/unsubscribe', { data: { endpoint: sub.endpoint } });
      await sub.unsubscribe();
    }
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err);
  }
}

/**
 * Kiểm tra trạng thái đăng ký push hiện tại (không call server).
 * Trả về: 'subscribed' | 'denied' | 'default' | 'unsupported'
 */
async function getPushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  const perm = Notification.permission;
  if (perm === 'denied') return 'denied';
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub ? 'subscribed' : 'default';
  } catch {
    return 'default';
  }
}

// ── Service object ────────────────────────────────────────────────────────────

const notificationService = {
  // In-app notifications
  getNotifications: () => api.get('/api/notifications'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markAsRead: (id) => api.post(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
  getBroadcastPreview: () => api.get('/api/notifications/broadcast-preview'),

  // SSE stream URL
  getStreamUrl: () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const token = localStorage.getItem('accessToken');
    return `${baseUrl}/api/notifications/stream?token=${token}`;
  },

  // Web Push
  subscribePush,
  unsubscribePush,
  getPushStatus,

  // Server-side push status
  getPushStatusFromServer: () => api.get('/api/push/status'),
  getPushStats: () => api.get('/api/push/stats'),
};

export default notificationService;
