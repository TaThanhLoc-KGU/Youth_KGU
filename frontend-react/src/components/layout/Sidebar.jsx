import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  ClipboardCheck,
  Award,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ChevronLeft,
  UserCheck,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { ROUTES, ROLES } from '../../utils/constants';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = {
    [ROLES.ADMIN]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD },
      { icon: Users, label: 'Sinh viên', path: ROUTES.ADMIN_STUDENTS },
      { icon: Activity, label: 'Hoạt động', path: ROUTES.ADMIN_ACTIVITIES },
      { icon: UserCheck, label: 'BCH Đoàn - Hội', path: ROUTES.ADMIN_BCH },
      { icon: ClipboardCheck, label: 'Điểm danh', path: ROUTES.ADMIN_ATTENDANCE },
      { icon: Award, label: 'Chứng nhận', path: ROUTES.ADMIN_CERTIFICATES },
      { icon: BarChart3, label: 'Thống kê', path: ROUTES.ADMIN_STATISTICS },
      { icon: Settings, label: 'Cài đặt', path: ROUTES.ADMIN_SETTINGS },
    ],
    [ROLES.BCH]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.BCH_DASHBOARD },
      { icon: Activity, label: 'Hoạt động', path: ROUTES.BCH_ACTIVITIES },
      { icon: ClipboardCheck, label: 'Điểm danh', path: ROUTES.BCH_ATTENDANCE },
      { icon: Award, label: 'Quét QR', path: ROUTES.BCH_SCAN_QR },
    ],
    [ROLES.SINHVIEN]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.STUDENT_DASHBOARD },
      { icon: Activity, label: 'Hoạt động', path: ROUTES.STUDENT_ACTIVITIES },
      { icon: ClipboardCheck, label: 'Đăng ký của tôi', path: ROUTES.STUDENT_REGISTRATIONS },
      { icon: Award, label: 'Chứng nhận', path: ROUTES.STUDENT_CERTIFICATES },
      { icon: Users, label: 'Hồ sơ', path: ROUTES.STUDENT_PROFILE },
    ],
  };

  const currentMenuItems = menuItems[user?.vaiTro] || [];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = ROUTES.LOGIN;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Youth KGU</h1>
              <p className="text-xs text-gray-500">Quản lý hoạt động</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-semibold text-sm">
              {user?.hoTen?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.hoTen || user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.vaiTro === ROLES.ADMIN && 'Quản trị viên'}
                {user?.vaiTro === ROLES.BCH && 'BCH Đoàn - Hội'}
                {user?.vaiTro === ROLES.SINHVIEN && 'Sinh viên'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {currentMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Đăng xuất' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
