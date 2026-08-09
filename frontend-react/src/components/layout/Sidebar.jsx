import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Activity, ClipboardCheck, Award, BarChart3,
  LogOut, Building2, UserCheck, Briefcase, BookOpen, Calendar,
  Zap, Building, UserCog, UserPlus, BarChart2, ScrollText, QrCode,
  Newspaper, FileText, FolderOpen, LayoutGrid, LayoutTemplate,
  SlidersHorizontal, Megaphone, RectangleHorizontal, Download, User, X,
  PenLine, Stamp, History, Mail, FileCheck, GraduationCap, Trophy, Home,
  ShieldCheck, Shield, Key, MessageCircle,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { ROUTES, ROLES, PERMISSIONS, MANAGER_ROLES } from '../../utils/constants';

// ─── Menu data ────────────────────────────────────────────────────────────────
const ADMIN_GROUPS = [
  {
    key: null,
    label: null,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, permission: null },
    ],
  },
  {
    key: 'users',
    label: 'Người dùng',
    items: [
      { icon: Users,     label: 'Sinh viên',       path: ROUTES.ADMIN_STUDENTS,   permission: PERMISSIONS.VIEW_SINH_VIEN    },
      { icon: Users,     label: 'Giảng viên',       path: ROUTES.ADMIN_GIANGVIEN,  permission: PERMISSIONS.VIEW_GIANG_VIEN   },
      { icon: UserCog,   label: 'Chuyên viên',      path: ROUTES.ADMIN_CHUYENVIEN, permission: PERMISSIONS.MANAGE_GIANG_VIEN, hideForKhoa: true },
      { icon: UserCheck, label: 'BCH Đoàn - Hội',  path: ROUTES.ADMIN_BCH,        permission: PERMISSIONS.VIEW_BCH          },
    ],
  },
  {
    key: 'org',
    label: 'Tổ chức',
    items: [
      { icon: Building2,     label: 'Khoa',                path: ROUTES.ADMIN_KHOA,        permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Briefcase,     label: 'Ngành',               path: ROUTES.ADMIN_NGANH,       permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: BookOpen,      label: 'Lớp / Chi đoàn',      path: ROUTES.ADMIN_LOP,         permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Users,         label: 'Đoàn viên',           path: '/admin/doan-vien-khoa',  permission: PERMISSIONS.XEM_SINH_VIEN },
      { icon: Calendar,      label: 'Khóa học',            path: ROUTES.ADMIN_KHOAHOC,     permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Zap,           label: 'Chức vụ',             path: ROUTES.ADMIN_CHUC_VU,     permission: PERMISSIONS.MANAGE_BCH       },
      { icon: Building,      label: 'Ban / Đội / CLB',     path: ROUTES.ADMIN_BAN,         permission: PERMISSIONS.MANAGE_BCH       },
      { icon: Trophy,        label: 'CLB / Đội / Nhóm',    path: ROUTES.ADMIN_CAU_LAC_BO,  permission: PERMISSIONS.QUAN_LY_CLB, hideForClb: true },
      { icon: Users,         label: 'Cổng CLB',            path: ROUTES.ADMIN_CLB_PORTAL,  anyOf: [PERMISSIONS.QUAN_LY_CLB, PERMISSIONS.QUAN_LY_THANH_VIEN_CLB] },
      { icon: GraduationCap, label: 'Năm học & Học kỳ',   path: ROUTES.ADMIN_NAM_HOC,     permission: PERMISSIONS.XEM_NAM_HOC, hideForKhoa: true },
    ],
  },
  {
    key: 'activities',
    label: 'Hoạt động',
    items: [
      { icon: Activity,       label: 'Hoạt động',         path: ROUTES.ADMIN_ACTIVITIES,  permission: PERMISSIONS.XEM_HOAT_DONG    },
      { icon: QrCode,         label: 'Điểm danh QR',      path: ROUTES.BCH_DIEM_DANH,     permission: PERMISSIONS.QUET_QR          },
      { icon: ClipboardCheck, label: 'Báo cáo điểm danh', path: ROUTES.ADMIN_ATTENDANCE,  permission: PERMISSIONS.MANAGE_DIEM_DANH },
      { icon: Award,          label: 'Cuộc thi & Bình chọn', path: '/admin/cuoc-thi',         permission: PERMISSIONS.QUAN_LY_CUOC_THI },
      { icon: Award,          label: 'Chứng nhận',           path: ROUTES.ADMIN_CERTIFICATES, permission: PERMISSIONS.QUAN_LY_DANG_KY  },
      { icon: BarChart3,      label: 'Điểm rèn luyện',       path: ROUTES.ADMIN_DIEM_REN_LUYEN, permission: PERMISSIONS.XEM_THONG_KE   },
    ],
  },
  {
    key: 'news',
    label: 'Tin tức',
    items: [
      { icon: Newspaper,  label: 'Tin tức',    path: ROUTES.ADMIN_NEWS,        permission: PERMISSIONS.DANG_TIN_TUC       },
      { icon: FileText,   label: 'Văn bản',    path: ROUTES.ADMIN_VAN_BAN,     permission: PERMISSIONS.QUAN_LY_VAN_BAN,    hideForKhoa: true },
      { icon: FolderOpen, label: 'Chuyên mục', path: ROUTES.ADMIN_CHUYEN_MUC,  permission: PERMISSIONS.QUAN_LY_CHUYEN_MUC, hideForKhoa: true },
    ],
  },
  {
    key: 'accounts',
    label: 'Tài khoản',
    items: [
      { icon: UserPlus,  label: 'Quản lý tài khoản', path: ROUTES.ADMIN_ACCOUNTS,           permission: PERMISSIONS.VIEW_TAI_KHOAN,   hideForKhoa: true },
      { icon: BarChart2, label: 'Thống kê',           path: ROUTES.ADMIN_ACCOUNT_STATISTICS, permission: PERMISSIONS.VIEW_THONG_KE,    hideForKhoa: true },
    ],
  },
  {
    key: 'permissions',
    label: 'Phân quyền',
    items: [
      { icon: ShieldCheck, label: 'Phân quyền', path: '/admin/phan-quyen', permission: PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM },
    ],
  },
  {
    key: 'system',
    label: 'Hệ thống',
    items: [
      { icon: ScrollText,          label: 'System Log',       path: '/admin/system-log',              permission: PERMISSIONS.VIEW_SYSTEM_LOG, hideForKhoa: true },
      { icon: LayoutGrid,          label: 'Bố cục Dashboard', path: ROUTES.ADMIN_LAYOUT_EDITOR,       permission: null, adminOnly: true },
      { icon: LayoutTemplate,      label: 'Bố cục News',      path: ROUTES.ADMIN_NEWS_LAYOUT_EDITOR,  permission: null, adminOnly: true },
      { icon: SlidersHorizontal,   label: 'Hero Slider',      path: ROUTES.ADMIN_SLIDER_MANAGER,      permission: null, adminOnly: true },
      { icon: Megaphone,           label: 'Tin chạy chữ',     path: ROUTES.ADMIN_TICKER_MANAGER,      permission: null, adminOnly: true },
      { icon: RectangleHorizontal, label: 'Banner & Widget',  path: ROUTES.ADMIN_AD_BANNER_MANAGER,   permission: null, adminOnly: true },
      { icon: Download,            label: 'Biểu mẫu',         path: ROUTES.ADMIN_BIEU_MAU_MANAGER,    permission: null, adminOnly: true },
      { icon: FileCheck,           label: 'Danh sách ban hành', path: ROUTES.ADMIN_BAN_HANH,          permission: PERMISSIONS.KY_SO_PDF },
      { icon: PenLine,             label: 'Chữ ký',           path: ROUTES.ADMIN_CHU_KY,              permission: PERMISSIONS.KY_SO_PDF },
      { icon: Stamp,               label: 'Con dấu',          path: ROUTES.ADMIN_CON_DAU,             permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: History,             label: 'Lịch sử ký số',    path: ROUTES.ADMIN_KY_SO_LICH_SU,       permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Mail,                label: 'Cấu hình Email',   path: ROUTES.ADMIN_EMAIL_CONFIG,         permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: MessageCircle,       label: 'Zalo OA',          path: '/admin/zalo-debug',               permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: FolderOpen,          label: 'Văn phòng điện tử', path: '/admin/van-phong',                permission: null },
    ],
  },
];

const STUDENT_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard',          path: ROUTES.STUDENT_DASHBOARD           },
  { icon: Calendar,        label: 'Đăng ký hoạt động', path: ROUTES.STUDENT_REGISTER_ACTIVITIES  },
  { icon: ClipboardCheck,  label: 'Hoạt động của tôi', path: ROUTES.STUDENT_MY_ACTIVITIES        },
  { icon: BarChart3,       label: 'Điểm rèn luyện',    path: ROUTES.STUDENT_TRAINING_POINTS      },
  { icon: Trophy,          label: 'Đăng ký CLB',       path: ROUTES.STUDENT_CLB_REGISTRATION     },
];

const ADMIN_SECTION_PERMS = [
  PERMISSIONS.XEM_SINH_VIEN, PERMISSIONS.XEM_GIANG_VIEN, PERMISSIONS.XEM_CHUYEN_VIEN,
  PERMISSIONS.XEM_BCH, PERMISSIONS.XEM_HOAT_DONG, PERMISSIONS.XEM_DIEM_DANH,
  PERMISSIONS.QUET_QR, PERMISSIONS.XEM_KHOA, PERMISSIONS.XEM_NGANH,
  PERMISSIONS.XEM_LOP, PERMISSIONS.XEM_KHOA_HOC, PERMISSIONS.QUAN_LY_CHUC_VU,
  PERMISSIONS.QUAN_LY_BAN, PERMISSIONS.CAI_DAT_HE_THONG, PERMISSIONS.XEM_TAI_KHOAN,
  PERMISSIONS.XEM_THONG_KE, PERMISSIONS.XEM_SYSTEM_LOG,
  PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM, PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN,
  PERMISSIONS.DANG_TIN_TUC, PERMISSIONS.SUA_TIN_TUC, PERMISSIONS.DUYET_TIN_TUC,
  PERMISSIONS.QUAN_LY_VAN_BAN, PERMISSIONS.QUAN_LY_CHUYEN_MUC,
  PERMISSIONS.QUAN_LY_CUOC_THI, PERMISSIONS.TAO_CUOC_THI,
  PERMISSIONS.XEM_CLB, PERMISSIONS.QUAN_LY_CLB, PERMISSIONS.QUAN_LY_THANH_VIEN_CLB,
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const { user, logout, hasPermission, hasAnyPermission, laAdmin, tenKhoa, maKhoa, tenClb, maClb } = useAuthStore();
  const isKhoaScoped = !!maKhoa;
  const isClbScoped  = !!maClb;
  const isAdmin      = laAdmin || user?.vaiTro === 'ADMIN';

  // Hiển thị admin sidebar khi user có role quản lý (bất kỳ cấp nào) VÀ có ít nhất 1 quyền
  const showAdminSection = MANAGER_ROLES.includes(user?.vaiTro) && (isAdmin || hasAnyPermission(ADMIN_SECTION_PERMS));
  const showStudent      = user?.vaiTro === ROLES.DOAN_VIEN;

  const handleLogout = async () => {
    try { await logout(); } catch {/* */}
    window.location.href = ROUTES.LOGIN;
  };

  const ROLE_DISPLAY = {
    ADMIN:            'Quản trị viên',
    QUAN_LY_KHOA:     'Bí thư Đoàn khoa',
    PHO_QUAN_LY_KHOA: 'Phó bí thư Đoàn khoa',
    QUAN_LY_CHI_DOAN: 'Bí thư chi đoàn',
    PHO_CHI_DOAN:     'Phó bí thư chi đoàn',
    DOAN_VIEN:        'Đoàn viên',
    DIEM_DANH_VIEN:   'CTV Điểm danh',
    QUAN_LY_CLB:      'Chủ nhiệm CLB',
  };
  const roleLabel = ROLE_DISPLAY[user?.vaiTro] || user?.vaiTro || '';

  const initial = (user?.hoTen || user?.username || 'U')[0].toUpperCase();

  const isActive = (path) =>
    location.pathname === path ||
    (path !== ROUTES.ADMIN_DASHBOARD && path !== ROUTES.BCH_DASHBOARD &&
     path !== ROUTES.STUDENT_DASHBOARD && location.pathname.startsWith(path + '/'));

  const NavItem = ({ icon: Icon, label, path }) => {
    const active = isActive(path);
    return (
      <li>
        <Link
          to={path}
          onClick={onClose}
          className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
            active
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
            active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
          }`} />
          <span className="truncate leading-tight">{label}</span>
          {active && <span className="ml-auto w-1 h-4 rounded-full bg-primary flex-shrink-0" />}
        </Link>
      </li>
    );
  };

  const renderGroup = (group) => {
    const visibleItems = group.items.filter((item) =>
      (!item.adminOnly || isAdmin) &&
      (!item.permission || hasPermission(item.permission)) &&
      (!item.anyOf || hasAnyPermission(item.anyOf)) &&
      !(item.hideForKhoa && isKhoaScoped) &&
      !(item.hideForClb && isClbScoped)
    );
    if (visibleItems.length === 0) return null;

    return (
      <div key={group.key ?? 'dash'} className="mb-1">
        {group.label && (
          <p className="px-2.5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 select-none">
            {group.label}
          </p>
        )}
        <ul className="space-y-0.5">
          {visibleItems.map((item) => (
            <NavItem key={item.path} icon={item.icon} label={item.label} path={item.path} />
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen h-[100dvh] w-60 flex flex-col z-40 bg-white border-r border-gray-100 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.06)' }}
      >
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-14 px-4 flex-shrink-0 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
                alt="Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Youth KGU</h1>
              <p className="text-[10px] text-gray-400 leading-tight">Quản lý Đoàn – Hội</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 custom-scrollbar">
          {showAdminSection && ADMIN_GROUPS.map((g) => renderGroup(g))}

          {showAdminSection && showStudent && (
            <div className="my-2 mx-2 border-t border-gray-100" />
          )}

          {showStudent && (
            <div className="mb-1">
              {showAdminSection && (
                <p className="px-2.5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 select-none">
                  Sinh viên
                </p>
              )}
              <ul className="space-y-0.5">
                {STUDENT_MENU.map((item) => (
                  <NavItem key={item.path} icon={item.icon} label={item.label} path={item.path} />
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* ── User + Logout ─────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* User info card */}
          <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-lg bg-gray-50">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
              <span className="text-primary font-bold text-xs">{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                {user?.hoTen || user?.username}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-gray-400 leading-tight">{roleLabel}</span>
                {(tenKhoa || tenClb) && (
                  <span className="text-[10px] text-primary font-semibold truncate leading-tight">
                    · {tenKhoa || tenClb}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile link */}
          <Link
            to={user?.vaiTro === ROLES.DOAN_VIEN ? ROUTES.STUDENT_DASHBOARD : ROUTES.PROFILE}
            onClick={onClose}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm w-full transition-colors ${
              location.pathname === ROUTES.PROFILE
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4 flex-shrink-0 text-gray-400" />
            <span>Hồ sơ cá nhân</span>
          </Link>

          {/* Home link */}
          <Link
            to="/news"
            onClick={onClose}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm w-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Home className="w-4 h-4 flex-shrink-0 text-gray-400" />
            <span>Trang tin tức</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm w-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
