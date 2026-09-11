import {
  LayoutDashboard, Users, Activity, ClipboardCheck, Award, BarChart3,
  Building2, UserCheck, Briefcase, BookOpen, Calendar,
  Zap, Building, UserCog, UserPlus, BarChart2, ScrollText, QrCode,
  Newspaper, FileText, FolderOpen, LayoutGrid, LayoutTemplate,
  SlidersHorizontal, Megaphone, RectangleHorizontal, Download,
  PenLine, Stamp, History, Mail, FileCheck, GraduationCap, Trophy,
  ShieldCheck, MessageCircle, Mailbox, MailPlus, Boxes,
} from 'lucide-react';
import { ROUTES, PERMISSIONS, MANAGER_ROLES } from '../utils/constants';
import useAuthStore from '../stores/authStore';

/**
 * Nguồn dữ liệu điều hướng admin dùng chung cho Sidebar + trang "Menu chức năng" (hub).
 * Mỗi cụm có icon/mô tả để render dạng thẻ chọn.
 */
export const ADMIN_GROUPS = [
  {
    key: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard,
    desc: 'Tổng quan số liệu Đoàn – Hội',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, permission: null },
    ],
  },
  {
    key: 'users', label: 'Người dùng', icon: Users,
    desc: 'Sinh viên, giảng viên, chuyên viên, BCH',
    items: [
      { icon: Users,     label: 'Sinh viên',       path: ROUTES.ADMIN_STUDENTS,   permission: PERMISSIONS.VIEW_SINH_VIEN    },
      { icon: Users,     label: 'Giảng viên',       path: ROUTES.ADMIN_GIANGVIEN,  permission: PERMISSIONS.VIEW_GIANG_VIEN   },
      { icon: UserCog,   label: 'Chuyên viên',      path: ROUTES.ADMIN_CHUYENVIEN, permission: PERMISSIONS.MANAGE_GIANG_VIEN, hideForKhoa: true },
      { icon: UserCheck, label: 'BCH Đoàn - Hội',  path: ROUTES.ADMIN_BCH,        permission: PERMISSIONS.VIEW_BCH          },
    ],
  },
  {
    key: 'org', label: 'Tổ chức', icon: Building2,
    desc: 'Khoa, ngành, lớp, chức vụ, CLB, năm học',
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
    key: 'activities', label: 'Hoạt động', icon: Activity,
    desc: 'Hoạt động, điểm danh, thi trắc nghiệm, chứng nhận, góp ý',
    items: [
      { icon: Activity,       label: 'Hoạt động',            path: ROUTES.ADMIN_ACTIVITIES,  permission: PERMISSIONS.XEM_HOAT_DONG    },
      { icon: QrCode,         label: 'Điểm danh QR',         path: ROUTES.BCH_DIEM_DANH,     permission: PERMISSIONS.QUET_QR          },
      { icon: ClipboardCheck, label: 'Báo cáo điểm danh',    path: ROUTES.ADMIN_ATTENDANCE,  permission: PERMISSIONS.MANAGE_DIEM_DANH },
      { icon: Award,          label: 'Cuộc thi & Bình chọn', path: '/admin/cuoc-thi',        permission: PERMISSIONS.QUAN_LY_CUOC_THI },
      { icon: FileCheck,      label: 'Thi trắc nghiệm',      path: ROUTES.ADMIN_TN_DE_THI,   anyOf: [PERMISSIONS.THI_TN_QUAN_LY_DE_THI, PERMISSIONS.THI_TN_QUAN_LY_CAU_HOI] },
      { icon: Award,          label: 'Chứng nhận',           path: ROUTES.ADMIN_CERTIFICATES, permission: PERMISSIONS.QUAN_LY_DANG_KY  },
      { icon: BarChart3,      label: 'Điểm rèn luyện',       path: ROUTES.ADMIN_DIEM_REN_LUYEN, permission: PERMISSIONS.XEM_THONG_KE   },
      { icon: Mailbox,        label: 'Góp ý',                path: ROUTES.ADMIN_GOP_Y,       permission: PERMISSIONS.XEM_GOP_Y        },
      { icon: MailPlus,       label: 'Soạn & Gửi Email',     path: ROUTES.ADMIN_EMAIL_BROADCAST, permission: PERMISSIONS.GUI_EMAIL_HANG_LOAT },
    ],
  },
  {
    key: 'news', label: 'Tin tức', icon: Newspaper,
    desc: 'Tin tức, văn bản, chuyên mục',
    items: [
      { icon: Newspaper,  label: 'Tin tức',    path: ROUTES.ADMIN_NEWS,        permission: PERMISSIONS.DANG_TIN_TUC       },
      { icon: FileText,   label: 'Văn bản',    path: ROUTES.ADMIN_VAN_BAN,     permission: PERMISSIONS.QUAN_LY_VAN_BAN,    hideForKhoa: true },
      { icon: FolderOpen, label: 'Chuyên mục', path: ROUTES.ADMIN_CHUYEN_MUC,  permission: PERMISSIONS.QUAN_LY_CHUYEN_MUC, hideForKhoa: true },
    ],
  },
  {
    key: 'accounts', label: 'Tài khoản', icon: UserPlus,
    desc: 'Quản lý tài khoản, thống kê & báo cáo',
    items: [
      { icon: UserPlus,  label: 'Quản lý tài khoản',   path: ROUTES.ADMIN_ACCOUNTS,           permission: PERMISSIONS.VIEW_TAI_KHOAN,   hideForKhoa: true },
      { icon: BarChart2, label: 'Thống kê & Báo cáo',  path: ROUTES.ADMIN_ACCOUNT_STATISTICS, permission: PERMISSIONS.VIEW_THONG_KE },
    ],
  },
  {
    key: 'permissions', label: 'Phân quyền', icon: ShieldCheck,
    desc: 'Ma trận quyền theo vai trò & tài khoản',
    items: [
      { icon: ShieldCheck, label: 'Phân quyền', path: '/admin/phan-quyen', permission: PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM },
    ],
  },
  {
    key: 'system', label: 'Hệ thống', icon: SlidersHorizontal,
    desc: 'Cấu hình, ký số, giao diện trang tin, tích hợp',
    items: [
      { icon: ScrollText,          label: 'System Log',        path: '/admin/system-log',             permission: PERMISSIONS.VIEW_SYSTEM_LOG, hideForKhoa: true },
      { icon: LayoutGrid,          label: 'Bố cục Dashboard',  path: ROUTES.ADMIN_LAYOUT_EDITOR,      permission: null, adminOnly: true },
      { icon: LayoutTemplate,      label: 'Bố cục News',       path: ROUTES.ADMIN_NEWS_LAYOUT_EDITOR, permission: null, adminOnly: true },
      { icon: SlidersHorizontal,   label: 'Hero Slider',       path: ROUTES.ADMIN_SLIDER_MANAGER,     permission: null, adminOnly: true },
      { icon: Megaphone,           label: 'Tin chạy chữ',      path: ROUTES.ADMIN_TICKER_MANAGER,     permission: null, adminOnly: true },
      { icon: RectangleHorizontal, label: 'Banner & Widget',   path: ROUTES.ADMIN_AD_BANNER_MANAGER,  permission: null, adminOnly: true },
      { icon: Download,            label: 'Biểu mẫu',          path: ROUTES.ADMIN_BIEU_MAU_MANAGER,   permission: null, adminOnly: true },
      { icon: FileCheck,           label: 'Danh sách ban hành', path: ROUTES.ADMIN_BAN_HANH,         permission: PERMISSIONS.KY_SO_PDF },
      { icon: PenLine,             label: 'Chữ ký',            path: ROUTES.ADMIN_CHU_KY,             permission: PERMISSIONS.KY_SO_PDF },
      { icon: Stamp,               label: 'Con dấu',           path: ROUTES.ADMIN_CON_DAU,            permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: History,             label: 'Lịch sử ký số',     path: ROUTES.ADMIN_KY_SO_LICH_SU,      permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: Mail,                label: 'Cấu hình Email',    path: ROUTES.ADMIN_EMAIL_CONFIG,       permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: SlidersHorizontal,   label: 'Cài đặt hệ thống',  path: ROUTES.ADMIN_SYSTEM_SETTINGS,    permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: MessageCircle,       label: 'Zalo OA',           path: '/admin/zalo-debug',             permission: PERMISSIONS.CAI_DAT_HE_THONG, hideForKhoa: true },
      { icon: FolderOpen,          label: 'Văn phòng điện tử', path: '/admin/van-phong',              permission: null },
    ],
  },
];

export const ADMIN_HUB_FALLBACK_ICON = Boxes;

/** Lọc item theo quyền của user hiện tại — logic dùng chung Sidebar + Hub. */
export function useVisibleAdminGroups() {
  const { user, hasPermission, hasAnyPermission, laAdmin, maKhoa, maClb } = useAuthStore();
  const isAdmin = laAdmin || user?.vaiTro === 'ADMIN';
  const isManager = MANAGER_ROLES.includes(user?.vaiTro);
  const isKhoaScoped = !!maKhoa;
  const isClbScoped = !!maClb;

  if (!isManager) return [];

  const canSee = (item) =>
    (!item.adminOnly || isAdmin) &&
    (!item.permission || hasPermission(item.permission)) &&
    (!item.anyOf || hasAnyPermission(item.anyOf)) &&
    !(item.hideForKhoa && isKhoaScoped) &&
    !(item.hideForClb && isClbScoped);

  return ADMIN_GROUPS
    .map((g) => ({ ...g, items: g.items.filter(canSee) }))
    .filter((g) => g.items.length > 0);
}

/** Tìm cụm + chức năng khớp pathname hiện tại (cho breadcrumb). */
export function findNavTrail(pathname) {
  for (const g of ADMIN_GROUPS) {
    for (const it of g.items) {
      if (pathname === it.path || pathname.startsWith(it.path + '/')) {
        return { group: g, item: it };
      }
    }
  }
  return null;
}
