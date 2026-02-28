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
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { ROUTES, ROLES, PERMISSIONS } from '../../utils/constants';
import { useState } from 'react';

// ─── Menu admin - mỗi item gắn permission tương ứng từ DB ───────────────────
// ADMIN luôn trả true cho hasPermission → tất cả vẫn hiển thị với ADMIN
// "Hồ sơ cá nhân" đã được chuyển ra item độc lập ở cuối nav (VẤN ĐỀ 3)
const ADMIN_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard',             path: ROUTES.ADMIN_DASHBOARD,          permission: null },
  // ── Quản lý đối tượng ─────────────────────────────────────────────────────
  { icon: Users,           label: 'Sinh viên',             path: ROUTES.ADMIN_STUDENTS,           permission: PERMISSIONS.VIEW_SINH_VIEN },
  { icon: Users,           label: 'Giảng viên',            path: ROUTES.ADMIN_GIANGVIEN,          permission: PERMISSIONS.VIEW_GIANG_VIEN },
  { icon: UserCog,         label: 'Chuyên viên',           path: ROUTES.ADMIN_CHUYENVIEN,         permission: PERMISSIONS.MANAGE_GIANG_VIEN },
  { icon: UserCheck,       label: 'BCH Đoàn - Hội',       path: ROUTES.ADMIN_BCH,                permission: PERMISSIONS.VIEW_BCH },
  // ── Dữ liệu cấu hình hệ thống ─────────────────────────────────────────────
  { icon: Building2,       label: 'Khoa',                  path: ROUTES.ADMIN_KHOA,               permission: PERMISSIONS.CAI_DAT_HE_THONG },
  { icon: Briefcase,       label: 'Ngành',                 path: ROUTES.ADMIN_NGANH,              permission: PERMISSIONS.CAI_DAT_HE_THONG },
  { icon: BookOpen,        label: 'Lớp',                   path: ROUTES.ADMIN_LOP,                permission: PERMISSIONS.CAI_DAT_HE_THONG },
  { icon: Calendar,        label: 'Khóa học',              path: ROUTES.ADMIN_KHOAHOC,            permission: PERMISSIONS.CAI_DAT_HE_THONG },
  { icon: Zap,             label: 'Chức vụ',               path: ROUTES.ADMIN_CHUC_VU,            permission: PERMISSIONS.MANAGE_BCH },
  { icon: Building,        label: 'Ban/Đội/CLB',           path: ROUTES.ADMIN_BAN,                permission: PERMISSIONS.MANAGE_BCH },
  // ── Hoạt động & Điểm danh ─────────────────────────────────────────────────
  { icon: Activity,        label: 'Hoạt động',             path: ROUTES.ADMIN_ACTIVITIES,         permission: PERMISSIONS.XEM_HOAT_DONG },
  { icon: ClipboardCheck,  label: 'Điểm danh',             path: ROUTES.ADMIN_ATTENDANCE,         permission: PERMISSIONS.MANAGE_DIEM_DANH },
  // ── eNews ─────────────────────────────────────────────────────────────────
  { icon: Newspaper,       label: 'Tin tức',               path: ROUTES.ADMIN_NEWS,               permission: PERMISSIONS.DANG_TIN_TUC },
  { icon: FileText,        label: 'Văn bản',               path: ROUTES.ADMIN_VAN_BAN,            permission: PERMISSIONS.QUAN_LY_VAN_BAN },
  { icon: FolderOpen,      label: 'Chuyên mục',            path: ROUTES.ADMIN_CHUYEN_MUC,         permission: PERMISSIONS.QUAN_LY_CHUYEN_MUC },
  // ── Tài khoản & Thống kê ──────────────────────────────────────────────────
  { icon: UserPlus,        label: 'Quản lý tài khoản',    path: ROUTES.ADMIN_ACCOUNTS,           permission: PERMISSIONS.VIEW_TAI_KHOAN },
  { icon: BarChart2,       label: 'Thống kê tài khoản',   path: ROUTES.ADMIN_ACCOUNT_STATISTICS, permission: PERMISSIONS.VIEW_THONG_KE },
  // ── Hệ thống ──────────────────────────────────────────────────────────────
  { icon: ScrollText,      label: 'System Log',            path: '/admin/system-log',             permission: PERMISSIONS.VIEW_SYSTEM_LOG },
  { icon: Shield,          label: 'Cài đặt & Phân quyền', path: ROUTES.ADMIN_SETTINGS,           permission: PERMISSIONS.MANAGE_ROLE_PERMISSIONS },
];

// ─── Menu BCH (ai có TAO_HOAT_DONG đều thấy) ─────────────────────────────────
// "Hồ sơ cá nhân" đã được chuyển ra item độc lập ở cuối nav (VẤN ĐỀ 3)
const BCH_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard BCH',       path: ROUTES.BCH_DASHBOARD,  permission: PERMISSIONS.TAO_HOAT_DONG },
  { icon: Activity,        label: 'Quản lý Hoạt động',  path: ROUTES.BCH_ACTIVITIES, permission: PERMISSIONS.TAO_HOAT_DONG },
  { icon: ClipboardCheck,  label: 'Điểm danh',           path: ROUTES.BCH_ATTENDANCE, permission: PERMISSIONS.QUET_QR },
  { icon: QrCode,          label: 'Quét QR',             path: ROUTES.BCH_SCAN_QR,    permission: PERMISSIONS.QUET_QR },
  // ── eNews BCH ─────────────────────────────────────────────────────────────
  { icon: Newspaper,       label: 'Đăng bài viết',       path: ROUTES.BCH_NEWS,       permission: PERMISSIONS.DANG_TIN_TUC },
  { icon: FileText,        label: 'Văn bản',              path: ROUTES.BCH_VAN_BAN,    permission: PERMISSIONS.QUAN_LY_VAN_BAN },
];

// ─── Menu sinh viên — 4 quyền cứng, mọi sinh viên đều có, không kiểm tra permission ─
// showStudent đã filter bởi vaiTro === SINHVIEN → permission: null cho tất cả (VẤN ĐỀ 2)
// "Hồ sơ cá nhân" đã được chuyển ra item độc lập ở cuối nav (VẤN ĐỀ 3)
// KHÔNG được thêm permission vào bất kỳ item nào trong STUDENT_MENU
const STUDENT_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard',           path: ROUTES.STUDENT_DASHBOARD,          permission: null },
  { icon: Calendar,        label: 'Đăng ký hoạt động',  path: ROUTES.STUDENT_REGISTER_ACTIVITIES,permission: null },
  { icon: ClipboardCheck,  label: 'Hoạt động của tôi',  path: ROUTES.STUDENT_MY_ACTIVITIES,      permission: null },
  { icon: TrendingUp,      label: 'Điểm rèn luyện',     path: ROUTES.STUDENT_TRAINING_POINTS,    permission: null },
];

// ─── Quyền "mở khóa" section quản trị ─────────────────────────────────────────
// Ai có ít nhất 1 trong các quyền này → thấy menu quản trị + truy cập /admin/*
const ADMIN_SECTION_PERMS = [
  PERMISSIONS.XEM_SINH_VIEN, PERMISSIONS.XEM_GIANG_VIEN, PERMISSIONS.XEM_CHUYEN_VIEN,
  PERMISSIONS.XEM_BCH, PERMISSIONS.XEM_HOAT_DONG, PERMISSIONS.XEM_DIEM_DANH,
  PERMISSIONS.XEM_KHOA, PERMISSIONS.XEM_NGANH, PERMISSIONS.XEM_LOP, PERMISSIONS.XEM_KHOA_HOC,
  PERMISSIONS.QUAN_LY_CHUC_VU, PERMISSIONS.QUAN_LY_BAN,
  PERMISSIONS.CAI_DAT_HE_THONG, PERMISSIONS.XEM_TAI_KHOAN, PERMISSIONS.XEM_THONG_KE,
  PERMISSIONS.XEM_SYSTEM_LOG, PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM,
  PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN,
  // eNews
  PERMISSIONS.DANG_TIN_TUC, PERMISSIONS.SUA_TIN_TUC, PERMISSIONS.DUYET_TIN_TUC,
  PERMISSIONS.QUAN_LY_VAN_BAN, PERMISSIONS.QUAN_LY_CHUYEN_MUC,
];

// ─── Component ────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const { user, logout, hasPermission, hasAnyPermission, laBCH, danhSachChucVu } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = user?.vaiTro === ROLES.ADMIN;

  // VẤN ĐỀ 1: Sinh viên thuần (SINHVIEN && !laBCH) KHÔNG BAO GIỜ thấy Admin section
  // dù backend vô tình gán quyền quản trị cho họ
  const isSinhVienThuan = user?.vaiTro === ROLES.SINHVIEN && !laBCH;
  const showAdminSection = !isSinhVienThuan && (isAdmin || hasAnyPermission(ADMIN_SECTION_PERMS));

  // BCH section: dùng flag laBCH từ backend
  // SINH_VIEN là BCH → laBCH=true → thấy BCH section
  // GIANG_VIEN là BCH → laBCH=true → thấy BCH section
  const showBCH = laBCH;

  // Student section: chỉ SINH_VIEN (kể cả SINH_VIEN là BCH, vaiTro vẫn là SINH_VIEN)
  const showStudent = user?.vaiTro === ROLES.SINHVIEN;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = ROUTES.LOGIN;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Lấy tên chức vụ hiển thị (chỉ BCH)
  const chucVuLabel = () => {
    if (isAdmin) return 'Quản trị viên';
    if (danhSachChucVu?.length > 0) return danhSachChucVu[0].tenChucVu;
    if (user?.vaiTro === ROLES.BCH) return 'BCH Đoàn - Hội';
    if (user?.vaiTro === ROLES.SINHVIEN) return 'Sinh viên';
    if (user?.vaiTro === ROLES.GIANG_VIEN) return 'Giảng viên';
    if (user?.vaiTro === ROLES.CHUYEN_VIEN) return 'Chuyên viên';
    return user?.vaiTro || '';
  };

  // Render một menu item
  const renderItem = (item) => {
    // Ẩn item nếu thiếu quyền (item.permission !== null)
    if (item.permission && !hasPermission(item.permission)) return null;

    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <li key={item.path}>
        <Link
          to={item.path}
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            isActive
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? item.label : ''}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium truncate">{item.label}</span>
          )}
        </Link>
      </li>
    );
  };

  // Render một section với tiêu đề
  const renderSection = (title, items) => (
    <div className="mb-2">
      {title && !isCollapsed && (
        <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </p>
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
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
              alt="Logo Đoàn"
              className="w-8 h-8 object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">Youth KGU</h1>
              <p className="text-xs text-gray-500 truncate">Quản lý hoạt động</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <ChevronLeft
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isCollapsed ? 'rotate-180' : ''
            }`}
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
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.hoTen || user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{chucVuLabel()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar space-y-1">
        {/* Admin section: ADMIN role hoặc ai có quyền quản trị (GV001, BCH cấp cao...)
            KHÔNG hiển thị cho sinh viên thuần dù có quyền admin (VẤN ĐỀ 1) */}
        {showAdminSection && renderSection(
          showBCH || showStudent ? 'Quản trị' : null,
          ADMIN_MENU
        )}

        {/* Divider giữa Admin và BCH */}
        {showAdminSection && showBCH && !isCollapsed && (
          <div className="border-t border-gray-100 my-2" />
        )}

        {/* BCH section */}
        {showBCH && renderSection(
          showAdminSection || showStudent ? 'Ban Chấp hành' : null,
          BCH_MENU
        )}

        {/* Divider giữa BCH/Admin và Student */}
        {(showAdminSection || showBCH) && showStudent && !isCollapsed && (
          <div className="border-t border-gray-100 my-2" />
        )}

        {/* Student section — 4 quyền cứng, luôn hiển thị với mọi SINH_VIEN (VẤN ĐỀ 2) */}
        {showStudent && renderSection(
          showAdminSection || showBCH ? 'Sinh viên' : null,
          STUDENT_MENU
        )}

        {/* VẤN ĐỀ 3: Hồ sơ cá nhân — LUÔN hiển thị với MỌI user đã đăng nhập
            Độc lập, không thuộc section nào, không có permission check
            Đường dẫn duy nhất: ROUTES.PROFILE = /profile (VẤN ĐỀ 4) */}
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
