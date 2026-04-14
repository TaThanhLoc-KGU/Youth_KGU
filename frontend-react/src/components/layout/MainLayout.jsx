import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Activity, QrCode, ClipboardCheck, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ROUTES } from '../../utils/constants';

const MainLayout = ({ title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Touch gestures for Sidebar
  const touchStartX = useRef(null);
  const touchCurrentX = useRef(null);
  const SWIPE_THRESHOLD = 70; // Cần vuốt 70px để kích hoạt
  const EDGE_THRESHOLD = 40;  // Chỉ bắt đầu vuốt từ cạnh màn hình (40px)

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const onTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchCurrentX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchCurrentX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchCurrentX.current) return;

    const diff = touchCurrentX.current - touchStartX.current;
    
    // Mở sidebar: vuốt từ trái sang phải, bắt đầu từ sát cạnh trái
    if (!isSidebarOpen && diff > SWIPE_THRESHOLD && touchStartX.current < EDGE_THRESHOLD) {
      setIsSidebarOpen(true);
    }
    
    // Đóng sidebar: vuốt từ phải sang trái bất cứ đâu khi đang mở
    if (isSidebarOpen && diff < -SWIPE_THRESHOLD) {
      setIsSidebarOpen(false);
    }

    // Reset
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  return (
    <div 
      className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col lg:block overflow-x-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-64 flex-1 flex flex-col">
        <Header
          title={title}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="p-4 sm:p-5 flex-1 pb-[calc(4rem+1.25rem+var(--sab))] pr-[calc(1.25rem+var(--sar))] pl-[calc(1.25rem+var(--sal))] lg:pl-5 lg:pr-5 lg:pb-5">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom navigation bar ─────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 w-full lg:hidden bg-white border-t border-gray-200 shadow-lg z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">
          {[
            { icon: LayoutDashboard, label: 'Dashboard',  path: ROUTES.ADMIN_DASHBOARD  },
            { icon: Activity,        label: 'Hoạt động',  path: ROUTES.ADMIN_ACTIVITIES },
            { icon: QrCode,          label: 'Quét QR',    path: ROUTES.BCH_DIEM_DANH   },
            { icon: ClipboardCheck,  label: 'Báo cáo',    path: ROUTES.ADMIN_ATTENDANCE },
          ].map(({ icon: Icon, label, path }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center flex-1 gap-0.5 text-xs transition-colors ${
                  active ? 'text-primary' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="leading-tight">{label}</span>
              </Link>
            );
          })}

          {/* Menu tab — opens sidebar */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center justify-center flex-1 gap-0.5 text-xs text-gray-400 transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="leading-tight">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
