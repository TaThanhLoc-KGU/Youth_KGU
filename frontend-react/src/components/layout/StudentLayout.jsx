import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarPlus, ClipboardList, TrendingUp, User, LogOut, Home, ChevronRight, Users, QrCode } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';
import useNotificationHistoryStore from '../../stores/notificationHistoryStore';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tổng quan',   path: ROUTES.STUDENT_DASHBOARD           },
  { icon: CalendarPlus,    label: 'Đăng ký',      path: ROUTES.STUDENT_REGISTER_ACTIVITIES },
  { icon: QrCode,          label: 'Điểm danh',    path: '/student/self-scan'               },
  { icon: ClipboardList,   label: 'Của tôi',      path: ROUTES.STUDENT_MY_ACTIVITIES       },
  { icon: Users,           label: 'CLB',           path: ROUTES.STUDENT_CLB_REGISTRATION    },
];

const StudentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const { unreadCount } = useNotificationHistoryStore();

  // close menu on navigate
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const currentNav = NAV_ITEMS.find(n => isActive(n.path));

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#f1f5f9' }}>
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 pt-[var(--sat,0px)]">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: logo + page title */}
          <div className="flex items-center gap-3">
            <img src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
              alt="Logo" className="w-7 h-7 object-contain flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400 leading-none">Youth KGU</p>
              <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                {currentNav?.label || 'Sinh viên'}
              </p>
            </div>
          </div>
          {/* Right: home + avatar menu */}
          <div className="flex items-center gap-1">
            <Link to="/" className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
              <Home className="w-5 h-5" />
            </Link>
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

      {/* ── User menu overlay ───────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-14 right-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up"
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

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>

      {/* ── Bottom Navigation Bar ────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.07)]">
          <div className="flex h-[3.75rem]">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
              const active = isActive(path);
              return (
                <Link key={path} to={path}
                  className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative">
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                  )}
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-[10px] font-medium leading-tight transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
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
