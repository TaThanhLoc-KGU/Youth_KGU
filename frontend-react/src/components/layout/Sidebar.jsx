import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Activity, ClipboardCheck, Award, BarChart3,
  Settings, LogOut, Building2, UserCheck, Briefcase, BookOpen, Calendar,
  Zap, Building, UserCog, UserPlus, BarChart2, ScrollText, QrCode,
  Newspaper, FileText, FolderOpen, LayoutGrid, LayoutTemplate,
  SlidersHorizontal, Megaphone, RectangleHorizontal, Download, User, X,
  PenLine, Stamp, History, Mail, FileCheck, GraduationCap, Trophy,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { ROUTES, ROLES, PERMISSIONS } from '../../utils/constants';

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
    label: 'Cơ cấu tổ chức',
    items: [
      { icon: Building2, label: 'Khoa',        path: ROUTES.ADMIN_KHOA,     permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Briefcase, label: 'Ngành',       path: ROUTES.ADMIN_NGANH,    permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: BookOpen,  label: 'Lớp',         path: ROUTES.ADMIN_LOP,      permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Calendar,  label: 'Khóa học',    path: ROUTES.ADMIN_KHOAHOC,  permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Zap,       label: 'Chức vụ',     path: ROUTES.ADMIN_CHUC_VU,     permission: PERMISSIONS.MANAGE_BCH       },
      { icon: Building,  label: 'Ban / Đội / CLB', path: ROUTES.ADMIN_BAN,  permission: PERMISSIONS.MANAGE_BCH       },
      { icon: Trophy,    label: 'CLB / Đội / Nhóm',   path: ROUTES.ADMIN_CAU_LAC_BO,  permission: PERMISSIONS.XEM_CLB },
      { icon: Users,     label: 'Cổng quản lý CLB',  path: ROUTES.ADMIN_CLB_PORTAL,  anyOf: [PERMISSIONS.QUAN_LY_CLB, PERMISSIONS.QUAN_LY_THANH_VIEN_CLB] },
      { icon: GraduationCap, label: 'Năm học & Học kỳ', path: ROUTES.ADMIN_NAM_HOC, permission: PERMISSIONS.XEM_NAM_HOC, hideForKhoa: true },
    ],
  },
  {
    key: 'activities',
    label: 'Hoạt động & Điểm danh',
    items: [
      { icon: Activity,       label: 'Hoạt động',           path: ROUTES.ADMIN_ACTIVITIES,  permission: PERMISSIONS.XEM_HOAT_DONG    },
      { icon: QrCode,         label: 'Điểm danh QR',        path: ROUTES.BCH_DIEM_DANH,     permission: PERMISSIONS.QUET_QR          },
      { icon: ClipboardCheck, label: 'Báo cáo điểm danh',   path: ROUTES.ADMIN_ATTENDANCE,  permission: PERMISSIONS.MANAGE_DIEM_DANH },
      { icon: Award,          label: 'Cuộc thi & Bình chọn',path: '/admin/cuoc-thi',        permission: PERMISSIONS.QUAN_LY_CUOC_THI },
    ],
  },
  {
    key: 'news',
    label: 'Tin tức & Văn bản',
    items: [
      { icon: Newspaper,  label: 'Tin tức',    path: ROUTES.ADMIN_NEWS,         permission: PERMISSIONS.DANG_TIN_TUC       },
      { icon: FileText,   label: 'Văn bản',    path: ROUTES.ADMIN_VAN_BAN,      permission: PERMISSIONS.QUAN_LY_VAN_BAN,    hideForKhoa: true },
      { icon: FolderOpen, label: 'Chuyên mục', path: ROUTES.ADMIN_CHUYEN_MUC,   permission: PERMISSIONS.QUAN_LY_CHUYEN_MUC, hideForKhoa: true },
    ],
  },
  {
    key: 'accounts',
    label: 'Tài khoản & Báo cáo',
    items: [
      { icon: UserPlus,  label: 'Quản lý tài khoản',    path: ROUTES.ADMIN_ACCOUNTS,           permission: PERMISSIONS.VIEW_TAI_KHOAN, hideForKhoa: true },
      { icon: BarChart2, label: 'Thống kê & Báo cáo',   path: ROUTES.ADMIN_ACCOUNT_STATISTICS, permission: PERMISSIONS.VIEW_THONG_KE,  hideForKhoa: true },
    ],
  },
  {
    key: 'system',
    label: 'Hệ thống',
    items: [
      { icon: ScrollText,         label: 'System Log',           path: '/admin/system-log',             permission: PERMISSIONS.VIEW_SYSTEM_LOG, adminOnly: false, hideForKhoa: true },
      { icon: LayoutGrid,         label: 'Bố cục Dashboard',     path: ROUTES.ADMIN_LAYOUT_EDITOR,      permission: null, adminOnly: true },
      { icon: LayoutTemplate,     label: 'Bố cục Trang News',    path: ROUTES.ADMIN_NEWS_LAYOUT_EDITOR, permission: null, adminOnly: true },
      { icon: SlidersHorizontal,  label: 'Hero Slider',          path: ROUTES.ADMIN_SLIDER_MANAGER,     permission: null, adminOnly: true },
      { icon: Megaphone,          label: 'Tin chạy chữ',         path: ROUTES.ADMIN_TICKER_MANAGER,     permission: null, adminOnly: true },
      { icon: RectangleHorizontal,label: 'Banner & Widget',      path: ROUTES.ADMIN_AD_BANNER_MANAGER,  permission: null, adminOnly: true },
      { icon: Download,           label: 'Biểu mẫu',             path: ROUTES.ADMIN_BIEU_MAU_MANAGER,   permission: null, adminOnly: true },
      { icon: FileCheck,          label: 'Danh sách ban hành',   path: ROUTES.ADMIN_BAN_HANH,           permission: PERMISSIONS.KY_SO_PDF,        hideForKhoa: true },
      { icon: PenLine,            label: 'Chữ ký',               path: ROUTES.ADMIN_CHU_KY,             permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Stamp,              label: 'Con dấu',              path: ROUTES.ADMIN_CON_DAU,            permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: History,            label: 'Lịch sử ký số',        path: ROUTES.ADMIN_KY_SO_LICH_SU,      permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Mail,               label: 'Cấu hình Email',        path: ROUTES.ADMIN_EMAIL_CONFIG,        permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
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
  const isClbScoped = !!maClb;

  const isAdmin = laAdmin;
  const showAdminSection = user?.vaiTro === ROLES.QUAN_LY && (laAdmin || hasAnyPermission(ADMIN_SECTION_PERMS));
  const showStudent = user?.vaiTro === ROLES.SINH_VIEN;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = ROUTES.LOGIN;
    } catch {/* silent */}
  };

  const roleLabel = isAdmin ? 'Quản trị viên'
    : user?.vaiTro === ROLES.QUAN_LY ? 'Quản lý'
    : user?.vaiTro === ROLES.SINH_VIEN ? 'Sinh viên'
    : user?.vaiTro || '';

  const isActive = (path) =>
    location.pathname === path ||
    (path !== ROUTES.ADMIN_DASHBOARD && path !== ROUTES.BCH_DASHBOARD &&
     path !== ROUTES.STUDENT_DASHBOARD && location.pathname.startsWith(path + '/'));

  const NavItem = ({ icon: Icon, label, path }) => (
    <li>
      <Link
        to={path}
        onClick={onClose}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
          isActive(path)
            ? 'bg-white/15 text-white font-semibold'
            : 'text-white/60 hover:bg-white/10 hover:text-white/95'
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive(path) ? 'text-white' : 'text-white/50'}`} />
        <span className="truncate leading-tight">{label}</span>
        {isActive(path) && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />
        )}
      </Link>
    </li>
  );

  // Render group: skip group if no visible items
  const renderGroup = (group) => {
    const visibleItems = group.items.filter((item) =>
      (!item.adminOnly || isAdmin) &&
      (!item.permission || hasPermission(item.permission)) &&
      (!item.anyOf || hasAnyPermission(item.anyOf)) &&
      !(item.hideForKhoa && isKhoaScoped)
    );
    if (visibleItems.length === 0) return null;

    return (
      <div key={group.key ?? 'dash'}>
        {group.label && (
          <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/30 select-none">
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
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen h-[100dvh] w-64 flex flex-col z-40 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #0d3f52 0%, #0a3347 100%)' }}
      >
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-14 px-4 flex-shrink-0 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity">
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
              alt="Logo Đoàn"
              className="w-7 h-7 object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white leading-tight">Youth KGU</h1>
              <p className="text-[10px] text-white/40 leading-tight">Quản lý hoạt động Đoàn</p>
            </div>
          </Link>
          {/* Close button — mobile only */}
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── User info ─────────────────────────────────────────────────── */}
        <div className="px-4 py-3 flex-shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 ring-2 ring-white/20">
              <span className="text-white font-semibold text-xs">
                {user?.hoTen?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate leading-tight">
                {user?.hoTen || user?.username}
              </p>
              <div className="flex flex-col gap-1 mt-1">
                <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white/60 leading-tight">
                  {roleLabel}
                </span>
                {tenKhoa && (
                  <span className="text-[10px] text-amber-300 font-semibold truncate leading-tight uppercase tracking-wider">
                    {tenKhoa}
                  </span>
                )}
                {tenClb && (
                  <span className="text-[10px] text-orange-300 font-semibold truncate leading-tight uppercase tracking-wider">
                    {tenClb}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-0 custom-scrollbar">
          {/* Admin section */}
          {showAdminSection && (
            <div className="space-y-0">
              {ADMIN_GROUPS.map((g) => renderGroup(g))}
            </div>
          )}

          {/* Divider if both sections */}
          {showAdminSection && showStudent && (
            <div className="my-2 border-t border-white/10" />
          )}

          {/* Student section */}
          {showStudent && (
            <div>
              {showAdminSection && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/30 select-none">
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

        {/* ── Footer: Profile + Logout ───────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-white/10 px-3 py-3 space-y-0.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            to={ROUTES.PROFILE}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm w-full ${
              location.pathname === ROUTES.PROFILE
                ? 'bg-white/15 text-white font-semibold'
                : 'text-white/60 hover:bg-white/10 hover:text-white/95'
            }`}
          >
            <User className="w-4 h-4 flex-shrink-0 text-white/50" />
            <span>Hồ sơ cá nhân</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm w-full text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
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
