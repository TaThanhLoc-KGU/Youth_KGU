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
      className="min-h-screen min-h-[100dvh] flex flex-col lg:block overflow-x-hidden"
      style={{ backgroundColor: '#f1f5f9' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-60 flex-1 flex flex-col">
        <Header
          title={title}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom navigation bar ─────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 w-full lg:hidden z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Blur card */}
        <div className="bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.07)]">
          <div className="flex items-stretch h-[3.75rem]">
            {[
              { icon: LayoutDashboard, label: 'Dashboard',  path: ROUTES.ADMIN_DASHBOARD  },
              { icon: Activity,        label: 'Hoạt động',  path: ROUTES.ADMIN_ACTIVITIES },
              { icon: QrCode,          label: 'Quét QR',    path: ROUTES.BCH_DIEM_DANH   },
              { icon: ClipboardCheck,  label: 'Báo cáo',    path: ROUTES.ADMIN_ATTENDANCE },
            ].map(({ icon: Icon, label, path }) => {
              const active = location.pathname === path || (path !== ROUTES.ADMIN_DASHBOARD && location.pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors relative"
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                  )}
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-[10px] leading-tight font-medium transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* Menu tab */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] leading-tight font-medium">Menu</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
