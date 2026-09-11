import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Activity, ClipboardCheck, Award, BarChart3,
  LogOut, Building2, UserCheck, Briefcase, BookOpen, Calendar,
  Zap, Building, UserCog, UserPlus, BarChart2, ScrollText, QrCode,
  Newspaper, FileText, FolderOpen, LayoutGrid, LayoutTemplate,
  SlidersHorizontal, Megaphone, RectangleHorizontal, Download, User, X,
  PenLine, Stamp, History, Mail, FileCheck, GraduationCap, Trophy, Home,
  ShieldCheck, Shield, Key, MessageCircle, Mailbox, MailPlus,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { ROUTES, ROLES, PERMISSIONS, MANAGER_ROLES } from '../../utils/constants';
import { ADMIN_GROUPS } from '../../config/adminNav';

// ─── Menu data ────────────────────────────────────────────────────────────────
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
  PERMISSIONS.KIEM_DUYET_BINH_LUAN, PERMISSIONS.QUAN_LY_CON_DAU,
  PERMISSIONS.XEM_GOP_Y, PERMISSIONS.XU_LY_GOP_Y, PERMISSIONS.GUI_EMAIL_HANG_LOAT,
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

  const NavItem = ({ icon: Icon, label, path, exact }) => {
    const active = exact ? location.pathname === path : isActive(path);
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
          {showAdminSection && (
            <ul className="space-y-0.5 mb-1">
              <NavItem icon={LayoutGrid} label="Menu chức năng" path="/admin" exact />
            </ul>
          )}
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
