import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';

const Header = ({ title, onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-base-100 border-b border-base-300 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2">
            <Search className="w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="bg-transparent border-none outline-none text-sm w-64"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-lg shadow-lg border border-base-300 py-2">
                <div className="px-4 py-2 border-b border-base-300">
                  <h3 className="font-semibold">Thông báo</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-base-200 cursor-pointer">
                    <p className="text-sm font-medium">
                      Hoạt động mới được tạo
                    </p>
                    <p className="text-xs opacity-70 mt-1">5 phút trước</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-base-200 cursor-pointer">
                    <p className="text-sm font-medium">
                      Sinh viên mới đăng ký
                    </p>
                    <p className="text-xs opacity-70 mt-1">10 phút trước</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-base-300">
                  <button className="text-sm text-primary hover:underline font-medium">
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
