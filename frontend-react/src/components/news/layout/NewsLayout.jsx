import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import NewsHeader from './NewsHeader';
import NewsFooter from './NewsFooter';
import NewsSidebar from './NewsSidebar';

const NewsLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NewsHeader
        onMenuToggle={() => setMobileMenuOpen(v => !v)}
        menuOpen={mobileMenuOpen}
        onMenuClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <NewsSidebar />
          </aside>
        </div>
      </main>

      <NewsFooter />
    </div>
  );
};

export default NewsLayout;
