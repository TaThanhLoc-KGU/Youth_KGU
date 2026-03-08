import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

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

        <main className="p-4 sm:p-6 flex-1 pb-[calc(1.5rem+var(--sab))] pr-[calc(1.5rem+var(--sar))] pl-[calc(1.5rem+var(--sal))] lg:pl-6 lg:pr-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
