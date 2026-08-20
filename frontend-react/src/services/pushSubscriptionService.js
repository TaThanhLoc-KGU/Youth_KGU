/**
 * Dịch vụ đăng ký/hủy Web Push Subscription (Push API + VAPID)
 * Khác với browserNotificationService (chỉ hoạt động khi tab đang mở),
 * push subscription cho phép nhận thông báo cả khi app đã đóng hẳn.
 */
import api from './api';

/** Chuyển VAPID public key dạng base64url sang Uint8Array cho applicationServerKey */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

const pushSubscriptionService = {
  /** Trình duyệt có hỗ trợ Web Push (Service Worker + Push API) không */
  isSupported: () => 'serviceWorker' in navigator && 'PushManager' in window,

  urlBase64ToUint8Array,

  /**
   * Trạng thái push hiện tại.
   * @returns {Promise<'unsupported'|'denied'|'default'|'subscribed'|'not-subscribed'>}
   */
  async getStatus() {
    if (!this.isSupported() || !('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    if (Notification.permission === 'default') return 'default';

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription ? 'subscribed' : 'not-subscribed';
    } catch (e) {
      console.warn('pushSubscriptionService.getStatus error:', e);
      return 'not-subscribed';
    }
  },

  /**
   * Đăng ký nhận push: lấy VAPID public key từ backend, subscribe qua PushManager,
   * rồi gửi subscription lên backend lưu lại.
   * @returns {Promise<boolean>} true nếu thành công
   */
  async subscribe() {
    if (!this.isSupported()) return false;

    try {
      const response = await api.get('/api/push/vapid-public-key');
      const publicKey = response.data?.data?.publicKey;
      if (!publicKey) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const { endpoint, keys } = subscription.toJSON();
      await api.post('/api/push/subscribe', {
        endpoint,
        keys,
        userAgent: navigator.userAgent,
      });

      return true;
    } catch (e) {
      // Người dùng từ chối quyền, hoặc lỗi mạng — không phải lỗi nghiêm trọng của app
      console.warn('pushSubscriptionService.subscribe error:', e);
      return false;
    }
  },

  /**
   * Hủy đăng ký push hiện tại (cả trên trình duyệt lẫn backend).
   * @returns {Promise<boolean>} true nếu thành công
   */
  async unsubscribe() {
    if (!this.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return true;

      const { endpoint } = subscription;
      await subscription.unsubscribe();
      await api.delete('/api/push/unsubscribe', { params: { endpoint } });

      return true;
    } catch (e) {
      console.warn('pushSubscriptionService.unsubscribe error:', e);
      return false;
    }
  },

  /** Yêu cầu backend gửi 1 push thử tới chính user đang đăng nhập */
  async sendTestPush() {
    try {
      const response = await api.post('/api/push/test');
      return response.data?.success ?? true;
    } catch (e) {
      console.warn('pushSubscriptionService.sendTestPush error:', e);
      return false;
    }
  },
};

export default pushSubscriptionService;
