import { Bell, Search, Menu, Check, BellOff, Home } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import browserNotificationService from '../../services/browserNotificationService';
import useNotificationHistoryStore from '../../stores/notificationHistoryStore';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const Header = ({ title, onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const eventSourceRef = useRef(null);
  const dropdownRef    = useRef(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Tải thông báo từ backend + thiết lập SSE ──────────────────────────────
  useEffect(() => {
    fetchNotifications();
    setupSSE();

    // Yêu cầu quyền browser notification (tự động, không-blocking)
    if (browserNotificationService.isSupported() &&
        browserNotificationService.getPermission() === 'default') {
      // Delay 3s sau khi Header mount để tránh popup quá sớm
      const t = setTimeout(() => {
        browserNotificationService.requestPermission().catch(() => {/* silent */});
      }, 3000);
      return () => clearTimeout(t);
    }

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
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

  const setupSSE = () => {
    try {
      const streamUrl = notificationService.getStreamUrl();
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.addEventListener('notification', (event) => {
        try {
          const newNotif = JSON.parse(event.data);

          // 1. Lưu vào persisted store
          addNotification(newNotif);

          // 2. Toast trong ứng dụng
          toast.info(newNotif.title, { position: 'top-right', autoClose: 5000 });

          // 3. Browser notification (OS-level) — khi tab không active hoặc luôn luôn
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
        // SSE tự kết nối lại — không cần làm gì thêm
        console.debug('SSE connection lost, will reconnect automatically');
      };
    } catch (e) {
      console.debug('SSE setup error:', e);
    }
  };

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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 pt-[var(--sat)]">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Link 
            to="/" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-primary flex items-center gap-2"
            title="Về trang tin tức"
          >
            <Home className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-medium">Trang chủ</span>
          </Link>

          <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

          <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="bg-transparent border-none outline-none text-sm w-64"
            />
          </div>

          {/* Nút bật browser notification (chỉ hiện khi chưa được cấp quyền) */}
          {!browserNotifGranted && browserNotificationService.isSupported() && (
            <button
              onClick={handleToggleBrowserNotif}
              title="Bật thông báo hệ thống"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <BellOff className="w-5 h-5" />
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
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
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Thông báo</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Đọc tất cả
                      </button>
                    )}
                  </div>
                </div>

                {/* Danh sách */}
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.isRead && markAsRead(notif.id)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                          notif.isRead
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-blue-50/40 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                          )}
                        </div>
                        {notif.message && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">
                          {formatDistanceToNow(
                            new Date(notif.receivedAt ?? notif.createdAt),
                            { addSuffix: true, locale: vi }
                          )}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-12 text-center">
                      <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Không có thông báo nào</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {notifications.length} thông báo
                  </span>
                  <button
                    onClick={handleToggleBrowserNotif}
                    className={`text-xs font-medium flex items-center gap-1 ${
                      browserNotifGranted
                        ? 'text-green-600 hover:text-green-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title={browserNotifGranted ? 'Thông báo hệ thống đang bật' : 'Bật thông báo hệ thống'}
                  >
                    {browserNotifGranted ? (
                      <><Bell className="w-3 h-3" /> Thông báo HĐH bật</>
                    ) : (
                      <><BellOff className="w-3 h-3" /> Bật thông báo HĐH</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
