import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col lg:block">
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
