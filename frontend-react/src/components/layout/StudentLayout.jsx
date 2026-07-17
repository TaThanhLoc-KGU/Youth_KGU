import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarPlus, ClipboardList, TrendingUp,
  User, LogOut, Home, ChevronRight, QrCode, Trophy, Users,
  Bell, Newspaper, Menu, X,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';
import useNotificationHistoryStore from '../../stores/notificationHistoryStore';

// Bottom nav (mobile): giới hạn 5 item quan trọng nhất
const BOTTOM_NAV = [
  { icon: LayoutDashboard, label: 'Tổng quan',  path: ROUTES.STUDENT_DASHBOARD           },
  { icon: CalendarPlus,    label: 'Đăng ký',    path: ROUTES.STUDENT_REGISTER_ACTIVITIES },
  { icon: QrCode,          label: 'Điểm danh',  path: '/student/self-scan'               },
  { icon: Users,           label: 'CLB',         path: ROUTES.STUDENT_CLB_REGISTRATION    },
  { icon: ClipboardList,   label: 'Của tôi',    path: ROUTES.STUDENT_MY_ACTIVITIES       },
];

// Sidebar (desktop): đầy đủ hơn
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tổng quan',        path: ROUTES.STUDENT_DASHBOARD           },
  { icon: CalendarPlus,    label: 'Đăng ký HĐ',       path: ROUTES.STUDENT_REGISTER_ACTIVITIES },
  { icon: QrCode,          label: 'Điểm danh QR',     path: '/student/self-scan'               },
  { icon: Trophy,          label: 'Cuộc thi',         path: ROUTES.STUDENT_CONTESTS            },
  { icon: Users,           label: 'CLB / Đội nhóm',   path: ROUTES.STUDENT_CLB_REGISTRATION    },
  { icon: ClipboardList,   label: 'Hoạt động của tôi', path: ROUTES.STUDENT_MY_ACTIVITIES      },
];

const StudentLayout = () => {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotificationHistoryStore();

  useEffect(() => { setMenuOpen(false); setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');
  const currentNav = NAV_ITEMS.find(n => isActive(n.path));

  // ── Sidebar link component ──────────────────────────────────────────────────
  const SidebarLink = ({ item }) => {
    const active = isActive(item.path);
    const Icon   = item.icon;
    return (
      <Link to={item.path}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
          active
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}>
        <Icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row" style={{ backgroundColor: '#f1f5f9' }}>

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white border-r border-gray-100 sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <img src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
            alt="Logo" className="w-8 h-8 object-contain" />
          <div>
            <p className="text-xs text-gray-400 leading-none">Youth KGU</p>
            <p className="text-sm font-bold text-gray-900 leading-tight">Sinh viên</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => <SidebarLink key={item.path} item={item} />)}
        </nav>

        {/* Quick links */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-1">
          <Link to={ROUTES.NEWS_HOME}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <Newspaper className="w-[18px] h-[18px] flex-shrink-0" /> Tin tức
          </Link>
          <Link to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <Home className="w-[18px] h-[18px] flex-shrink-0" /> Trang chủ
          </Link>
        </div>

        {/* User card */}
        <div className="mx-3 mb-4 bg-gray-50 rounded-2xl p-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">
              {user?.hoTen?.charAt(0) || user?.username?.charAt(0) || 'S'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.hoTen || user?.username}</p>
            {user?.linkedEntityId && (
              <p className="text-xs text-gray-400">MSSV: {user.linkedEntityId}</p>
            )}
          </div>
          <button onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ───────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <img src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
                  alt="Logo" className="w-7 h-7 object-contain" />
                <span className="font-bold text-gray-900 text-sm">Youth KGU</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(item => <SidebarLink key={item.path} item={item} />)}
            </nav>
            <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-1">
              <Link to={ROUTES.NEWS_HOME}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                <Newspaper className="w-[18px] h-[18px]" /> Tin tức
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                <LogOut className="w-[18px] h-[18px]" /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Right side: header + content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top Header (mobile: always shown; desktop: shown) ─────────────── */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 pt-[var(--sat,0px)]">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left: hamburger (mobile) | breadcrumb (desktop) */}
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              {/* Desktop: show current page title */}
              <div className="min-w-0">
                <p className="hidden lg:block text-xs text-gray-400 leading-none">Youth KGU · Sinh viên</p>
                <p className="lg:hidden text-xs text-gray-400 leading-none">Youth KGU</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                  {currentNav?.label || 'Sinh viên'}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1">
              <Link to="/" className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              {/* Avatar button */}
              <div className="relative">
                <button onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">
                      {user?.hoTen?.charAt(0) || user?.username?.charAt(0) || 'S'}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* User menu dropdown */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMenuOpen(false)}>
            <div className="absolute top-14 right-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="px-4 py-3 bg-primary/5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.hoTen || user?.username}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || (user?.linkedEntityId ? `MSSV: ${user.linkedEntityId}` : '')}</p>
              </div>
              <Link to={ROUTES.STUDENT_DASHBOARD} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <User className="w-4 h-4 text-gray-400" /> Hồ sơ cá nhân
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full border-t border-gray-100">
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          </div>
        )}

        {/* ── Page content ──────────────────────────────────────────────────── */}
        <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Navigation (mobile only) ─────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.07)]">
          <div className="flex h-[3.75rem]">
            {BOTTOM_NAV.map(({ icon: Icon, label, path }) => {
              const active = isActive(path);
              return (
                <Link key={path} to={path}
                  className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative">
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                  )}
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-[10px] font-medium leading-tight transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default StudentLayout;
