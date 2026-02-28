import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import NewsHeader from './NewsHeader';
import NewsFooter from './NewsFooter';
import NewsSidebar from './NewsSidebar';

const NewsLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NewsHeader
        onMenuToggle={() => setMobileMenuOpen((v) => !v)}
        menuOpen={mobileMenuOpen}
      />

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Content area */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>

          {/* Right sidebar — only on very large screens */}
          <aside className="hidden xl:block w-72 flex-shrink-0">
            <NewsSidebar />
          </aside>
        </div>
      </main>

      <NewsFooter />
    </div>
  );
};

export default NewsLayout;
