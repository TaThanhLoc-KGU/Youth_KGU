/**
 * Hook theo dõi session timeout - SLIDING SESSION.
 * - Timeout chỉ tính khi KHÔNG CÓ hoạt động (mouse/keyboard/touch).
 * - Mỗi khi user hoạt động → reset timer về 0.
 * - Mặc định: 8 giờ không hoạt động → cảnh báo → đăng xuất.
 * - Kiểm tra lại ngay khi tab trở nên active (tránh timer bị delay bởi trình duyệt).
 */
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import useAuthStore from '../stores/authStore';
import useNotificationHistoryStore from '../stores/notificationHistoryStore';

const INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 giờ không hoạt động
const WARNING_BEFORE_MS     =     5 * 60 * 1000;   // cảnh báo trước 5 phút
const CHECK_INTERVAL_MS     =         30 * 1000;   // kiểm tra mỗi 30 giây
const ACTIVITY_DEBOUNCE_MS  =         60 * 1000;   // update lastActive tối đa 1 lần/phút

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
const LAST_ACTIVE_KEY = 'lastActiveTime';

const useSessionTimeout = () => {
  const logout          = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const hasWarnedRef      = useRef(false);
  const warningToastIdRef = useRef(null);
  const intervalRef       = useRef(null);
  const lastDebounceRef   = useRef(0);

  const getLastActive = useCallback(() => {
    const stored = localStorage.getItem(LAST_ACTIVE_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  }, []);

  const updateLastActive = useCallback(() => {
    const now = Date.now();
    // Debounce: chỉ ghi localStorage tối đa 1 lần/phút
    if (now - lastDebounceRef.current < ACTIVITY_DEBOUNCE_MS) return;
    lastDebounceRef.current = now;
    localStorage.setItem(LAST_ACTIVE_KEY, String(now));
    // Reset warning nếu user vừa hoạt động lại
    hasWarnedRef.current = false;
    if (warningToastIdRef.current) {
      toast.dismiss(warningToastIdRef.current);
      warningToastIdRef.current = null;
    }
  }, []);

  const doExpire = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (warningToastIdRef.current) toast.dismiss(warningToastIdRef.current);

    toast.info(
      '⏰ Phiên đăng nhập đã hết do không hoạt động. Bạn sẽ được tự động đăng xuất.',
      { toastId: 'session-expired', autoClose: 4000 }
    );

    setTimeout(async () => {
      try {
        useNotificationHistoryStore.getState().reset();
        localStorage.removeItem(LAST_ACTIVE_KEY);
        await logout();
      } finally {
        window.location.href = '/login?expired=1';
      }
    }, 3500);
  }, [logout]);

  const checkNow = useCallback(() => {
    if (!isAuthenticated) return;
    const lastActive = getLastActive();
    const elapsed    = Date.now() - lastActive;
    const remaining  = INACTIVITY_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      doExpire();
      return;
    }

    // Cảnh báo 5 phút cuối không hoạt động
    if (remaining <= WARNING_BEFORE_MS && !hasWarnedRef.current) {
      hasWarnedRef.current = true;
      const minutesLeft = Math.ceil(remaining / 60_000);
      warningToastIdRef.current = toast.warning(
        `⚠️ Bạn không hoạt động trong một lúc. Phiên sẽ hết hạn sau ${minutesLeft} phút.`,
        { autoClose: false, closeButton: true, toastId: 'session-warning' }
      );
    }
  }, [isAuthenticated, getLastActive, doExpire]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Đánh dấu active ngay khi hook mount (user vừa login hoặc reload trang)
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    hasWarnedRef.current = false;

    // Theo dõi hoạt động người dùng
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, updateLastActive, { passive: true }));

    // Kiểm tra ngay (xử lý trường hợp tab mở lại sau khi ngủ)
    checkNow();

    // Kiểm tra định kỳ
    intervalRef.current = setInterval(checkNow, CHECK_INTERVAL_MS);

    // Kiểm tra khi tab trở nên active
    const handleVisibilityChange = () => {
      if (!document.hidden) checkNow();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, updateLastActive));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, checkNow, updateLastActive]);
};

export default useSessionTimeout;
