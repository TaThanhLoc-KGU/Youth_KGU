import { Bell, Menu, Check, BellOff, Home, LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';
import notificationService from '../../services/notificationService';
import browserNotificationService from '../../services/browserNotificationService';
import useNotificationHistoryStore from '../../stores/notificationHistoryStore';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const MAX_SSE_ERRORS   = 5;    // đóng sau 5 lỗi liên tiếp
const SSE_BACKOFF_BASE = 5000; // retry đầu tiên sau 5s, tăng dần theo 2^n (tối đa 5 phút)

const Header = ({ title, onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const eventSourceRef  = useRef(null);
  const dropdownRef     = useRef(null);
  const userMenuRef     = useRef(null);
  const sseErrorCount   = useRef(0);
  const sseRetryTimer   = useRef(null);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Ẩn thông báo khi đang ở trang điểm danh (tránh làm phân tâm khi quét QR)
  const isAttendancePage = location.pathname.includes('/attendance') || location.pathname.includes('/scan-qr');

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch {/* silent */}
  };

  // Dùng persisted notification history store thay vì local state
  const {
    items: notifications,
    unreadCount,
    add: addNotification,
    syncFromBackend,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
  } = useNotificationHistoryStore();

  // ── Đóng dropdown khi click ra ngoài ────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Tải thông báo từ backend + thiết lập SSE ──────────────────────────────
  useEffect(() => {
    if (isAttendancePage) return; // Không cần SSE khi đang điểm danh
    fetchNotifications();
    setupSSE();

    // Yêu cầu quyền browser notification (tự động, không-blocking)
    let t;
    if (browserNotificationService.isSupported() &&
        browserNotificationService.getPermission() === 'default') {
      // Delay 3s sau khi Header mount để tránh popup quá sớm
      t = setTimeout(() => {
        browserNotificationService.requestPermission().catch(() => {/* silent */});
      }, 3000);
    }

    return () => {
      clearTimeout(t);
      clearTimeout(sseRetryTimer.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      if (response?.data?.success) {
        syncFromBackend(response.data.data ?? []);
      }
    } catch (error) {
      // Silent — 403 bình thường nếu user không có quyền
      console.debug('Notifications fetch skipped:', error?.response?.status);
    }
  };

  const setupSSE = useCallback(() => {
    // Hủy EventSource cũ nếu còn
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return; // Chưa đăng nhập — không cần SSE

      const streamUrl = notificationService.getStreamUrl();
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      // Kết nối thành công → reset error count
      es.onopen = () => {
        sseErrorCount.current = 0;
      };

      es.addEventListener('notification', (event) => {
        sseErrorCount.current = 0; // nhận được message → kết nối ổn
        try {
          const newNotif = JSON.parse(event.data);
          addNotification(newNotif);
          toast.info(newNotif.title, { position: 'top-right', autoClose: 5000 });
          const meta = browserNotificationService.getNotifMeta(newNotif.type);
          browserNotificationService.send({
            title: `${meta.prefix}: ${newNotif.title}`,
            body:  newNotif.message ?? '',
            icon:  meta.icon,
            tag:   `notif-${newNotif.id}`,
            onClick: () => setShowNotifications(true),
          });
        } catch (e) {
          console.warn('SSE notification parse error:', e);
        }
      });

      es.onerror = () => {
        sseErrorCount.current += 1;

        // Đóng EventSource ngay để ngừng spam (browser sẽ không tự retry nữa)
        es.close();
        eventSourceRef.current = null;

        if (sseErrorCount.current >= MAX_SSE_ERRORS) {
          // Quá nhiều lỗi → backoff mạnh hơn (tối đa 5 phút)
          const delay = Math.min(SSE_BACKOFF_BASE * Math.pow(2, sseErrorCount.current - MAX_SSE_ERRORS), 300_000);
          console.debug(`SSE: ${sseErrorCount.current} lỗi liên tiếp, thử lại sau ${delay / 1000}s`);
          sseRetryTimer.current = setTimeout(setupSSE, delay);
        } else {
          // Retry nhanh trong lần đầu
          const delay = SSE_BACKOFF_BASE * sseErrorCount.current;
          console.debug(`SSE connection lost, retry sau ${delay / 1000}s`);
          sseRetryTimer.current = setTimeout(setupSSE, delay);
        }
      };
    } catch (e) {
      console.debug('SSE setup error:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (id) => {
    try {
      storeMarkAsRead(id);           // Cập nhật local ngay lập tức
      await notificationService.markAsRead(id); // Sync backend
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      storeMarkAllAsRead();
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // ── Bật/tắt browser notification ────────────────────────────────────────────
  const handleToggleBrowserNotif = async () => {
    if (!browserNotificationService.isSupported()) {
      toast.warning('Trình duyệt không hỗ trợ thông báo hệ thống.');
      return;
    }
    if (browserNotificationService.getPermission() === 'denied') {
      toast.warning('Bạn đã từ chối thông báo. Vui lòng bật lại trong cài đặt trình duyệt.');
      return;
    }
    const granted = await browserNotificationService.requestPermission();
    if (granted) {
      toast.success('Đã bật thông báo hệ thống!');
    } else {
      toast.info('Bạn có thể bật thông báo hệ thống bất kỳ lúc nào trong cài đặt trình duyệt.');
    }
  };

  const browserNotifGranted = browserNotificationService.isGranted();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 pt-[var(--sat)]">
      {/* Accent top line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">

        {/* Left: mobile menu + page title */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-gray-800 truncate">{title}</h1>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Home link */}
          <Link
            to="/news"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            title="Về trang tin tức"
          >
            <Home className="w-4 h-4" />
            <span className="font-medium">Tin tức</span>
          </Link>

          {/* Browser notification toggle (only when not granted, not on attendance page) */}
          {!isAttendancePage && !browserNotifGranted && browserNotificationService.isSupported() && (
            <button
              onClick={handleToggleBrowserNotif}
              title="Bật thông báo hệ thống"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <BellOff className="w-4.5 h-4.5" />
            </button>
          )}

          {/* ── Notification bell (ẩn khi đang điểm danh) ──────────── */}
          {!isAttendancePage && <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 text-sm">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary-700 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đọc tất cả
                    </button>
                  )}
                </div>
                <div className="max-h-[380px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.isRead && markAsRead(notif.id)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                          notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm leading-snug ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0" />}
                        </div>
                        {notif.message && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          {formatDistanceToNow(new Date(notif.receivedAt ?? notif.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-10 text-center">
                      <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Không có thông báo</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <span className="text-xs text-gray-400">{notifications.length} thông báo</span>
                  <button
                    onClick={handleToggleBrowserNotif}
                    className={`text-xs flex items-center gap-1 ${browserNotifGranted ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {browserNotifGranted ? <><Bell className="w-3 h-3" /> HĐH bật</> : <><BellOff className="w-3 h-3" /> Bật HĐH</>}
                  </button>
                </div>
              </div>
            )}
          </div>}

          {/* ── User avatar dropdown ────────────────────────────────── */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-xs">
                  {user?.hoTen?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user?.hoTen || user?.username}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 py-1">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.hoTen || user?.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email || user?.username}</p>
                </div>
                <Link
                  to={user?.vaiTro === 'DOAN_VIEN' ? '/student/dashboard' : ROUTES.PROFILE}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Hồ sơ cá nhân
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full border-t border-gray-100 mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
