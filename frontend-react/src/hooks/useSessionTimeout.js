/**
 * Hook theo dõi session timeout.
 * - Cảnh báo 5 phút trước khi hết hạn (toast warning).
 * - Tự động đăng xuất và redirect sau 1 giờ kể từ lúc đăng nhập.
 * - Kiểm tra lại ngay khi tab trở nên active (tránh timer bị delay bởi trình duyệt).
 */
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import useAuthStore from '../stores/authStore';
import useNotificationHistoryStore from '../stores/notificationHistoryStore';

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 giờ
const WARNING_BEFORE_MS   =  5 * 60 * 1000; // cảnh báo trước 5 phút
const CHECK_INTERVAL_MS   =      30 * 1000; // kiểm tra mỗi 30 giây

const useSessionTimeout = () => {
  const logout          = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginTime       = useAuthStore((s) => s.loginTime);

  const hasWarnedRef      = useRef(false);
  const warningToastIdRef = useRef(null);
  const intervalRef       = useRef(null);

  const doExpire = useCallback(async () => {
    // Dừng interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Xóa toast cảnh báo
    if (warningToastIdRef.current) toast.dismiss(warningToastIdRef.current);

    toast.info(
      '⏰ Phiên đăng nhập đã hết 1 giờ. Bạn sẽ được tự động đăng xuất.',
      { toastId: 'session-expired', autoClose: 4000 }
    );

    setTimeout(async () => {
      try {
        useNotificationHistoryStore.getState().reset();
        await logout();
      } finally {
        window.location.href = '/login?expired=1';
      }
    }, 3500);
  }, [logout]);

  const checkNow = useCallback(() => {
    if (!isAuthenticated || !loginTime) return;
    const elapsed   = Date.now() - loginTime;
    const remaining = SESSION_DURATION_MS - elapsed;

    if (remaining <= 0) {
      doExpire();
      return;
    }

    // Cảnh báo 5 phút cuối (chỉ hiện 1 lần)
    if (remaining <= WARNING_BEFORE_MS && !hasWarnedRef.current) {
      hasWarnedRef.current = true;
      const minutesLeft = Math.ceil(remaining / 60_000);
      warningToastIdRef.current = toast.warning(
        `⚠️ Phiên đăng nhập sắp hết hạn trong ${minutesLeft} phút. Vui lòng lưu lại công việc.`,
        { autoClose: false, closeButton: true, toastId: 'session-warning' }
      );
    }
  }, [isAuthenticated, loginTime, doExpire]);

  useEffect(() => {
    if (!isAuthenticated || !loginTime) return;

    hasWarnedRef.current = false;

    // Kiểm tra ngay lập tức (xử lý trường hợp tab mở lại sau khi sleep)
    checkNow();

    // Kiểm tra định kỳ
    intervalRef.current = setInterval(checkNow, CHECK_INTERVAL_MS);

    // Kiểm tra khi tab trở nên active (tránh trình duyệt throttle timer)
    const handleVisibilityChange = () => {
      if (!document.hidden) checkNow();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, loginTime, checkNow]);
};

export default useSessionTimeout;
