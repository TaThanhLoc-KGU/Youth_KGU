/**
 * Hook quản lý session timeout.
 *
 * Hai lý do tự động đăng xuất:
 *  1. Cả access token VÀ refresh token đều hết hạn (hard expiry)
 *  2. Người dùng không hoạt động quá INACTIVITY_TIMEOUT_MS (soft expiry)
 *
 * Soft expiry reset về 0 mỗi khi có tương tác (mouse/keyboard/touch/scroll).
 * Kiểm tra ngay khi tab trở nên active (tránh timer bị browser throttle khi tab nền).
 */
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import useAuthStore from '../stores/authStore';
import useNotificationHistoryStore from '../stores/notificationHistoryStore';
import authService from '../services/authService';

const INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 giờ
const WARNING_BEFORE_MS     =     5 * 60 * 1000;   // cảnh báo 5 phút trước
const CHECK_INTERVAL_MS     =         15 * 1000;   // kiểm tra mỗi 15 giây
const ACTIVITY_DEBOUNCE_MS  =         30 * 1000;   // ghi lastActive tối đa 1 lần/30s

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
const LAST_ACTIVE_KEY = 'lastActiveTime';

const useSessionTimeout = () => {
  const logout          = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const hasWarnedRef      = useRef(false);
  const warningToastIdRef = useRef(null);
  const intervalRef       = useRef(null);
  const expiringRef       = useRef(false); // tránh gọi doExpire nhiều lần
  const lastDebounceRef   = useRef(0);

  const getLastActive = useCallback(() => {
    const stored = localStorage.getItem(LAST_ACTIVE_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  }, []);

  const updateLastActive = useCallback(() => {
    const now = Date.now();
    if (now - lastDebounceRef.current < ACTIVITY_DEBOUNCE_MS) return;
    lastDebounceRef.current = now;
    localStorage.setItem(LAST_ACTIVE_KEY, String(now));

    // Huỷ cảnh báo nếu user vừa hoạt động lại
    if (hasWarnedRef.current) {
      hasWarnedRef.current = false;
      if (warningToastIdRef.current) {
        toast.dismiss(warningToastIdRef.current);
        warningToastIdRef.current = null;
      }
    }
  }, []);

  const doExpire = useCallback((reason = 'Phiên đăng nhập đã hết.') => {
    if (expiringRef.current) return;
    expiringRef.current = true;

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (warningToastIdRef.current) toast.dismiss(warningToastIdRef.current);

    toast.info(`⏰ ${reason} Bạn sẽ được tự động đăng xuất.`, {
      toastId: 'session-expired',
      autoClose: 4000,
    });

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
    if (!isAuthenticated || expiringRef.current) return;

    // ── Kiểm tra 1: Token hết hạn hoàn toàn ──────────────────────────────
    const accessToken  = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken) {
      doExpire('Phiên đăng nhập không hợp lệ.');
      return;
    }

    const accessExpired  = authService.isTokenExpired(accessToken);
    const refreshExpired = !refreshToken || authService.isTokenExpired(refreshToken);

    if (accessExpired && refreshExpired) {
      doExpire('Phiên đăng nhập đã hết hạn.');
      return;
    }

    // ── Kiểm tra 2: Không hoạt động quá lâu ─────────────────────────────
    const elapsed   = Date.now() - getLastActive();
    const remaining = INACTIVITY_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      doExpire('Phiên đăng nhập đã hết do không hoạt động.');
      return;
    }

    // Cảnh báo 5 phút cuối
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

    // Reset state
    expiringRef.current  = false;
    hasWarnedRef.current = false;
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));

    // Theo dõi hoạt động người dùng
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, updateLastActive, { passive: true })
    );

    // Kiểm tra ngay khi mount (xử lý trường hợp tab được mở lại sau khi ngủ)
    checkNow();

    // Kiểm tra định kỳ
    intervalRef.current = setInterval(checkNow, CHECK_INTERVAL_MS);

    // Kiểm tra ngay khi tab trở nên visible (laptop mở lại sau khi ngủ)
    const onVisibilityChange = () => {
      if (!document.hidden) checkNow();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Kiểm tra khi tab được focus lại
    const onFocus = () => checkNow();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, updateLastActive));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated, checkNow, updateLastActive]);
};

export default useSessionTimeout;
