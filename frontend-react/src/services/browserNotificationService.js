/**
 * Dịch vụ gửi Browser Notification (OS-level push)
 * Hỗ trợ cả desktop (Notification API) và mobile (Service Worker)
 */

// Đăng ký Service Worker khi app khởi động
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

const browserNotificationService = {
  /** Trình duyệt có hỗ trợ Notification API không */
  isSupported: () => 'Notification' in window,

  /** Trạng thái quyền hiện tại: 'granted' | 'denied' | 'default' */
  getPermission: () => ('Notification' in window ? Notification.permission : 'denied'),

  /** Đã được cấp quyền gửi thông báo */
  isGranted: () => 'Notification' in window && Notification.permission === 'granted',

  /**
   * Yêu cầu quyền thông báo từ người dùng.
   * Nên gọi sau khi người dùng click vào nút (yêu cầu gesture).
   * @returns {Promise<boolean>} true nếu được cấp quyền
   */
  async requestPermission() {
    if (!this.isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  /**
   * Gửi notification — ưu tiên Service Worker (hoạt động trên mobile)
   * fallback về Notification API nếu không có SW
   */
  async send({ title, body, icon, tag, onClick, url } = {}) {
    if (!this.isGranted()) return null;

    const opts = {
      body:  body  || '',
      icon:  icon  || '/logo.png',
      badge: '/logo.png',
      tag:   tag   || `youthkgu-${Date.now()}`,
    };

    try {
      // Ưu tiên Service Worker (mobile-friendly)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          ...opts,
          renotify: true,
          data: { url: url || window.location.pathname },
        });
        return true;
      }

      // Fallback: Notification API trực tiếp (desktop)
      const notif = new Notification(title, opts);
      if (onClick) {
        notif.onclick = () => { window.focus(); onClick(); notif.close(); };
      }
      setTimeout(() => notif.close(), 6000);
      return notif;
    } catch (e) {
      console.warn('Browser notification error:', e);
      return null;
    }
  },

  /**
   * Trả về label và icon phù hợp theo loại thông báo từ backend
   */
  getNotifMeta(type) {
    switch (type) {
      case 'HOAT_DONG': return { prefix: '🎯 Hoạt động',   icon: '/logo.png' };
      case 'TIN_TUC':   return { prefix: '📰 Tin tức',     icon: '/logo.png' };
      case 'HE_THONG':  return { prefix: '⚙️ Hệ thống',    icon: '/logo.png' };
      case 'DIEM_DANH': return { prefix: '✅ Điểm danh',   icon: '/logo.png' };
      default:          return { prefix: '🔔 Thông báo',   icon: '/logo.png' };
    }
  },
};

export default browserNotificationService;
