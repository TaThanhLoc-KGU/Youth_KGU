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
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  UserCheck,
  Briefcase,
  BookOpen,
  Calendar,
  Zap,
  Building,
  UserCog,
  User,
  UserPlus,
  BarChart2,
  ScrollText,
  Shield,
  QrCode,
  TrendingUp,
  Newspaper,
  FileText,
  FolderOpen,
  LayoutGrid,
  LayoutTemplate,
  SlidersHorizontal,
  Megaphone,
  RectangleHorizontal,
  Download,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { ROUTES, ROLES, PERMISSIONS } from '../../utils/constants';
import { useState } from 'react';

// ─── Menu admin phẳng (giữ nguyên để logic không đổi) ─────────────────────────
const ADMIN_MENU_FLAT = [
  { icon: LayoutDashboard, label: 'Dashboard',             path: ROUTES.ADMIN_DASHBOARD,          permission: null,                          group: null },
  // ── Quản lý người dùng ────────────────────────────────────────────────────────
  { icon: Users,           label: 'Sinh viên',             path: ROUTES.ADMIN_STUDENTS,           permission: PERMISSIONS.VIEW_SINH_VIEN,    group: 'users' },
  { icon: Users,           label: 'Giảng viên',            path: ROUTES.ADMIN_GIANGVIEN,          permission: PERMISSIONS.VIEW_GIANG_VIEN,   group: 'users' },
  { icon: UserCog,         label: 'Chuyên viên',           path: ROUTES.ADMIN_CHUYENVIEN,         permission: PERMISSIONS.MANAGE_GIANG_VIEN, group: 'users' },
  { icon: UserCheck,       label: 'BCH Đoàn - Hội',       path: ROUTES.ADMIN_BCH,                permission: PERMISSIONS.VIEW_BCH,          group: 'users' },
  // ── Cơ cấu tổ chức ────────────────────────────────────────────────────────────
  { icon: Building2,       label: 'Khoa',                  path: ROUTES.ADMIN_KHOA,               permission: PERMISSIONS.CAI_DAT_HE_THONG,  group: 'org' },
  { icon: Briefcase,       label: 'Ngành',                 path: ROUTES.ADMIN_NGANH,              permission: PERMISSIONS.CAI_DAT_HE_THONG,  group: 'org' },
  { icon: BookOpen,        label: 'Lớp',                   path: ROUTES.ADMIN_LOP,                permission: PERMISSIONS.CAI_DAT_HE_THONG,  group: 'org' },
  { icon: Calendar,        label: 'Khóa học',              path: ROUTES.ADMIN_KHOAHOC,            permission: PERMISSIONS.CAI_DAT_HE_THONG,  group: 'org' },
  { icon: Zap,             label: 'Chức vụ',               path: ROUTES.ADMIN_CHUC_VU,            permission: PERMISSIONS.MANAGE_BCH,        group: 'org' },
  { icon: Building,        label: 'Ban/Đội/CLB',           path: ROUTES.ADMIN_BAN,                permission: PERMISSIONS.MANAGE_BCH,        group: 'org' },
  // ── Hoạt động & Điểm danh ─────────────────────────────────────────────────────
  { icon: Activity,        label: 'Hoạt động',             path: ROUTES.ADMIN_ACTIVITIES,         permission: PERMISSIONS.XEM_HOAT_DONG,     group: 'activities' },
  { icon: ClipboardCheck,  label: 'Điểm danh',             path: ROUTES.ADMIN_ATTENDANCE,         permission: PERMISSIONS.MANAGE_DIEM_DANH,  group: 'activities' },
  // ── Tin tức & Văn bản ─────────────────────────────────────────────────────────
  { icon: Newspaper,       label: 'Tin tức',               path: ROUTES.ADMIN_NEWS,               permission: PERMISSIONS.DANG_TIN_TUC,      group: 'news' },
  { icon: FileText,        label: 'Văn bản',               path: ROUTES.ADMIN_VAN_BAN,            permission: PERMISSIONS.QUAN_LY_VAN_BAN,   group: 'news' },
  { icon: FolderOpen,      label: 'Chuyên mục',            path: ROUTES.ADMIN_CHUYEN_MUC,         permission: PERMISSIONS.QUAN_LY_CHUYEN_MUC,group: 'news' },
  // ── Tài khoản ─────────────────────────────────────────────────────────────────
  { icon: UserPlus,        label: 'Quản lý tài khoản',    path: ROUTES.ADMIN_ACCOUNTS,           permission: PERMISSIONS.VIEW_TAI_KHOAN,    group: 'accounts' },
  { icon: BarChart2,       label: 'Thống kê tài khoản',   path: ROUTES.ADMIN_ACCOUNT_STATISTICS, permission: PERMISSIONS.VIEW_THONG_KE,     group: 'accounts' },
  // ── Hệ thống ──────────────────────────────────────────────────────────────────
  { icon: ScrollText,      label: 'System Log',            path: '/admin/system-log',             permission: PERMISSIONS.VIEW_SYSTEM_LOG,        group: 'system' },
  { icon: Shield,          label: 'Phân quyền BCH',        path: ROUTES.ADMIN_PHAN_QUYEN,         permission: PERMISSIONS.MANAGE_ROLE_PERMISSIONS, group: 'system' },
  { icon: LayoutGrid,         label: 'Bố cục Dashboard',      path: ROUTES.ADMIN_LAYOUT_EDITOR,      permission: null, group: 'system', adminOnly: true },
  { icon: LayoutTemplate,     label: 'Bố cục Trang News',     path: ROUTES.ADMIN_NEWS_LAYOUT_EDITOR, permission: null, group: 'system', adminOnly: true },
  { icon: SlidersHorizontal,    label: 'Quản lý Hero Slider',    path: ROUTES.ADMIN_SLIDER_MANAGER,     permission: null, group: 'system', adminOnly: true },
  { icon: Megaphone,            label: 'Quản lý Tin chạy chữ',  path: ROUTES.ADMIN_TICKER_MANAGER,     permission: null, group: 'system', adminOnly: true },
  { icon: RectangleHorizontal,  label: 'Quản lý Banner & Widget',path: ROUTES.ADMIN_AD_BANNER_MANAGER,  permission: null, group: 'system', adminOnly: true },
  { icon: Download,             label: 'Quản lý Biểu mẫu',      path: ROUTES.ADMIN_BIEU_MAU_MANAGER,   permission: null, group: 'system', adminOnly: true },
];

// Cấu hình nhóm (giữ nguyên thứ tự hiển thị)
const ADMIN_GROUPS = [
  { key: 'users',      label: 'Người dùng',         icon: Users },
  { key: 'org',        label: 'Cơ cấu tổ chức',      icon: Building2 },
  { key: 'activities', label: 'Hoạt động & Điểm danh', icon: Activity },
  { key: 'news',       label: 'Tin tức & Văn bản',   icon: Newspaper },
  { key: 'accounts',   label: 'Tài khoản',            icon: UserPlus },
  { key: 'system',     label: 'Hệ thống',             icon: Settings },
];

// ─── Menu BCH ─────────────────────────────────────────────────────────────────
const BCH_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard BCH',       path: ROUTES.BCH_DASHBOARD,  permission: PERMISSIONS.TAO_HOAT_DONG },
  { icon: Activity,        label: 'Quản lý Hoạt động',  path: ROUTES.BCH_ACTIVITIES, permission: PERMISSIONS.TAO_HOAT_DONG },
  { icon: ClipboardCheck,  label: 'Điểm danh',           path: ROUTES.BCH_ATTENDANCE, permission: PERMISSIONS.QUET_QR },
  { icon: QrCode,          label: 'Quét QR',             path: ROUTES.BCH_SCAN_QR,    permission: PERMISSIONS.QUET_QR },
  { icon: Newspaper,       label: 'Đăng bài viết',       path: ROUTES.BCH_NEWS,       permission: PERMISSIONS.DANG_TIN_TUC },
  { icon: FileText,        label: 'Văn bản',              path: ROUTES.BCH_VAN_BAN,    permission: PERMISSIONS.QUAN_LY_VAN_BAN },
  { icon: Shield,          label: 'Phân quyền BCH',       path: ROUTES.BCH_PHAN_QUYEN, permission: PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM },
];

// ─── Menu sinh viên ────────────────────────────────────────────────────────────
const STUDENT_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard',           path: ROUTES.STUDENT_DASHBOARD,          permission: null },
  { icon: Calendar,        label: 'Đăng ký hoạt động',  path: ROUTES.STUDENT_REGISTER_ACTIVITIES,permission: null },
  { icon: ClipboardCheck,  label: 'Hoạt động của tôi',  path: ROUTES.STUDENT_MY_ACTIVITIES,      permission: null },
  { icon: TrendingUp,      label: 'Điểm rèn luyện',     path: ROUTES.STUDENT_TRAINING_POINTS,    permission: null },
];

// ─── Quyền mở section quản trị ────────────────────────────────────────────────
const ADMIN_SECTION_PERMS = [
  PERMISSIONS.XEM_SINH_VIEN, PERMISSIONS.XEM_GIANG_VIEN, PERMISSIONS.XEM_CHUYEN_VIEN,
  PERMISSIONS.XEM_BCH, PERMISSIONS.XEM_HOAT_DONG, PERMISSIONS.XEM_DIEM_DANH,
  PERMISSIONS.XEM_KHOA, PERMISSIONS.XEM_NGANH, PERMISSIONS.XEM_LOP, PERMISSIONS.XEM_KHOA_HOC,
  PERMISSIONS.QUAN_LY_CHUC_VU, PERMISSIONS.QUAN_LY_BAN,
  PERMISSIONS.CAI_DAT_HE_THONG, PERMISSIONS.XEM_TAI_KHOAN, PERMISSIONS.XEM_THONG_KE,
  PERMISSIONS.XEM_SYSTEM_LOG, PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM,
  PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN,
  PERMISSIONS.DANG_TIN_TUC, PERMISSIONS.SUA_TIN_TUC, PERMISSIONS.DUYET_TIN_TUC,
  PERMISSIONS.QUAN_LY_VAN_BAN, PERMISSIONS.QUAN_LY_CHUYEN_MUC,
];

// ─── Component ────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const { user, logout, hasPermission, hasAnyPermission, laBCH, danhSachChucVu } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Trạng thái mở/đóng từng nhóm (mặc định: mở nhóm chứa route hiện tại)
  const [openGroups, setOpenGroups] = useState(() => {
    const current = ADMIN_MENU_FLAT.find((m) => m.path && location.pathname.startsWith(m.path) && m.path !== '/admin');
    const activeGroup = current?.group;
    return ADMIN_GROUPS.reduce((acc, g) => ({ ...acc, [g.key]: g.key === activeGroup }), {});
  });

  const isAdmin = user?.vaiTro === ROLES.ADMIN;
  const isSinhVienThuan = user?.vaiTro === ROLES.SINHVIEN && !laBCH;
  const showAdminSection = !isSinhVienThuan && (isAdmin || hasAnyPermission(ADMIN_SECTION_PERMS));
  const showBCH = laBCH;
  const showStudent = user?.vaiTro === ROLES.SINHVIEN;

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = ROUTES.LOGIN;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const chucVuLabel = () => {
    if (isAdmin) return 'Quản trị viên';
    if (danhSachChucVu?.length > 0) return danhSachChucVu[0].tenChucVu;
    if (user?.vaiTro === ROLES.BCH) return 'BCH Đoàn - Hội';
    if (user?.vaiTro === ROLES.SINHVIEN) return 'Sinh viên';
    if (user?.vaiTro === ROLES.GIANG_VIEN) return 'Giảng viên';
    if (user?.vaiTro === ROLES.CHUYEN_VIEN) return 'Chuyên viên';
    return user?.vaiTro || '';
  };

  // Render một item đơn giản
  const renderItem = (item) => {
    if (item.adminOnly && !isAdmin) return null;
    if (item.permission && !hasPermission(item.permission)) return null;
    const Icon = item.icon;
    const isActive = location.pathname === item.path
      || (item.path !== ROUTES.ADMIN_DASHBOARD && item.path !== ROUTES.BCH_DASHBOARD
          && item.path !== ROUTES.STUDENT_DASHBOARD && location.pathname.startsWith(item.path + '/'));

    return (
      <li key={item.path}>
        <Link
          to={item.path}
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? item.label : ''}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
        </Link>
      </li>
    );
  };

  // Render nhóm có thể collapse
  const renderGroup = (group) => {
    const items = ADMIN_MENU_FLAT.filter((m) => m.group === group.key);
    const visibleItems = items.filter((m) =>
      (!m.adminOnly || isAdmin) && (!m.permission || hasPermission(m.permission))
    );
    if (visibleItems.length === 0) return null;

    const isOpen = openGroups[group.key];
    const GroupIcon = group.icon;
    const hasActive = visibleItems.some(
      (m) => location.pathname === m.path
        || (m.path !== ROUTES.ADMIN_DASHBOARD && location.pathname.startsWith(m.path + '/'))
    );

    if (isCollapsed) {
      // Khi thu gọn: chỉ hiển thị các icon item, không có nhóm
      return (
        <ul key={group.key} className="space-y-1">
          {visibleItems.map((item) => renderItem(item))}
        </ul>
      );
    }

    return (
      <div key={group.key} className="mb-1">
        <button
          onClick={() => toggleGroup(group.key)}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-left ${
            hasActive ? 'text-primary font-semibold' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <GroupIcon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider">{group.label}</span>
          </div>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />}
        </button>
        {isOpen && (
          <ul className="space-y-0.5 mt-0.5 pl-2">
            {visibleItems.map((item) => renderItem(item))}
          </ul>
        )}
      </div>
    );
  };

  // Render section non-grouped (BCH, Student)
  const renderFlatSection = (title, items) => (
    <div className="mb-2">
      {title && !isCollapsed && (
        <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      )}
      <ul className="space-y-1">
        {items.map((item) => renderItem(item))}
      </ul>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
        {!isCollapsed ? (
          <Link to="/" className="flex items-center gap-2 overflow-hidden hover:opacity-80 transition-opacity">
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
              alt="Logo Đoàn"
              className="w-8 h-8 object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">Youth KGU</h1>
              <p className="text-xs text-gray-500 truncate">Quản lý hoạt động</p>
            </div>
          </Link>
        ) : (
          <Link to="/" className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
              alt="Logo Đoàn"
              className="w-8 h-8 object-contain"
            />
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <ChevronLeft
            className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-semibold text-sm">
              {user?.hoTen?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.hoTen || user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{chucVuLabel()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">

        {/* Dashboard admin (không thuộc nhóm) */}
        {showAdminSection && (() => {
          const dashItem = ADMIN_MENU_FLAT.find((m) => m.group === null);
          return dashItem ? (
            <ul className="space-y-1 mb-2">
              {renderItem(dashItem)}
            </ul>
          ) : null;
        })()}

        {/* Admin groups */}
        {showAdminSection && (
          <div className={`space-y-0.5 ${(showBCH || showStudent) ? 'mb-3' : ''}`}>
            {!isCollapsed && (showBCH || showStudent) && (
              <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Quản trị</p>
            )}
            {ADMIN_GROUPS.map((g) => renderGroup(g))}
          </div>
        )}

        {/* Divider */}
        {showAdminSection && showBCH && !isCollapsed && <div className="border-t border-gray-100 my-2" />}

        {/* BCH section */}
        {showBCH && renderFlatSection(
          (showAdminSection || showStudent) ? 'Ban Chấp hành' : null,
          BCH_MENU
        )}

        {/* Divider */}
        {(showAdminSection || showBCH) && showStudent && !isCollapsed && <div className="border-t border-gray-100 my-2" />}

        {/* Student section */}
        {showStudent && renderFlatSection(
          (showAdminSection || showBCH) ? 'Sinh viên' : null,
          STUDENT_MENU
        )}

        {/* Profile link */}
        <div className="border-t border-gray-100 my-2" />
        <ul className="space-y-1">
          <li>
            <Link
              to={ROUTES.PROFILE}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                location.pathname === ROUTES.PROFILE ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? 'Hồ sơ cá nhân' : ''}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">Hồ sơ cá nhân</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Đăng xuất' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium truncate">Đăng xuất</span>}
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
