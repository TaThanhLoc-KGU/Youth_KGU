import { Bell, BellOff, BellRing, Search, Menu, X, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import notificationService from '../../services/notificationService';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const Header = ({ title, onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushStatus, setPushStatus] = useState('default'); // 'default'|'subscribed'|'denied'|'unsupported'|'loading'
  const eventSourceRef = useRef(null);

  // ── Khởi tạo SSE + trạng thái push ───────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    initPushStatus();

    const streamUrl = notificationService.getStreamUrl();
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('notification', (event) => {
      const newNotif = JSON.parse(event.data);
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.info(newNotif.title, { position: 'top-right', autoClose: 5000 });
    });

    eventSource.onerror = () => eventSource.close();

    return () => eventSourceRef.current?.close();
  }, []);

  const initPushStatus = async () => {
    const status = await notificationService.getPushStatus();
    setPushStatus(status);
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.filter((n) => !n.isRead).length);
      }
    } catch (_) {}
  };

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  // ── Bật / Tắt push notification ───────────────────────────────────────────
  const handlePushToggle = async () => {
    if (pushStatus === 'subscribed') {
      // Tắt thông báo
      setPushStatus('loading');
      await notificationService.unsubscribePush();
      setPushStatus('default');
      toast.info('Đã tắt thông báo trình duyệt');
    } else if (pushStatus === 'denied') {
      toast.warn('Bạn đã chặn thông báo. Vào Cài đặt trình duyệt để bật lại.');
    } else if (pushStatus === 'unsupported') {
      toast.warn('Trình duyệt của bạn không hỗ trợ thông báo đẩy.');
    } else {
      // Bật thông báo
      setPushStatus('loading');
      const result = await notificationService.subscribePush();
      if (result === 'subscribed') {
        setPushStatus('subscribed');
        toast.success('Đã bật thông báo trình duyệt!');
      } else if (result === 'denied') {
        setPushStatus('denied');
        toast.warn('Bạn đã từ chối quyền thông báo.');
      } else if (result === 'unsupported') {
        setPushStatus('unsupported');
      } else {
        setPushStatus('default');
        toast.error('Không thể bật thông báo. Vui lòng thử lại.');
      }
    }
  };

  // Icon + tooltip cho nút push
  const pushMeta = {
    subscribed: { Icon: BellRing, label: 'Tắt thông báo', cls: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    denied:     { Icon: BellOff,  label: 'Thông báo bị chặn', cls: 'text-red-400 bg-red-50 cursor-not-allowed' },
    loading:    { Icon: Bell,     label: 'Đang xử lý...', cls: 'text-gray-400 animate-pulse' },
    unsupported:{ Icon: BellOff,  label: 'Không hỗ trợ', cls: 'text-gray-300 cursor-not-allowed' },
    default:    { Icon: Bell,     label: 'Bật thông báo', cls: 'text-gray-500 hover:text-blue-600 hover:bg-blue-50' },
  };
  const pm = pushMeta[pushStatus] ?? pushMeta.default;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="bg-transparent border-none outline-none text-sm w-64"
            />
          </div>

          {/* Nút bật / tắt push notification */}
          <button
            onClick={handlePushToggle}
            disabled={pushStatus === 'loading' || pushStatus === 'unsupported'}
            title={pm.label}
            className={`p-2 rounded-lg transition-colors ${pm.cls}`}
          >
            <pm.Icon className="w-5 h-5" />
          </button>

          {/* Chuông thông báo in-app */}
          <div className="relative">
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
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>

                {/* Gợi ý bật push nếu chưa subscribe */}
                {pushStatus === 'default' && (
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between gap-2">
                    <p className="text-xs text-blue-700">Bật thông báo để không bỏ lỡ hoạt động mới</p>
                    <button
                      onClick={() => { setShowNotifications(false); handlePushToggle(); }}
                      className="text-xs font-semibold text-blue-700 whitespace-nowrap hover:underline"
                    >
                      Bật ngay
                    </button>
                  </div>
                )}

                <div className="max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                          notification.isRead ? 'bg-white' : 'bg-blue-50/40 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
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

                <div className="px-4 py-3 border-t border-gray-100 text-center">
                  <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                    Xem tất cả thông báo
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
