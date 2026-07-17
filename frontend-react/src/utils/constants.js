// User Roles - must match backend VaiTroEnum names exactly (6-level hierarchy)
export const ROLES = {
  ADMIN:              'ADMIN',
  QUAN_LY_KHOA:       'QUAN_LY_KHOA',
  PHO_QUAN_LY_KHOA:   'PHO_QUAN_LY_KHOA',
  QUAN_LY_CHI_DOAN:   'QUAN_LY_CHI_DOAN',
  PHO_CHI_DOAN:       'PHO_CHI_DOAN',
  DOAN_VIEN:          'DOAN_VIEN',
  DIEM_DANH_VIEN:     'DIEM_DANH_VIEN',
  QUAN_LY_CLB:        'QUAN_LY_CLB',

  // Aliases tương thích ngược (mapping từ hệ thống cũ)
  SINH_VIEN:          'DOAN_VIEN',
  SINHVIEN:           'DOAN_VIEN',
  QUAN_LY:            'QUAN_LY_KHOA',
  BCH:                'QUAN_LY_CHI_DOAN',
  GIANG_VIEN:         'QUAN_LY_KHOA',
};

// Các role được phép vào khu vực quản trị (không phải đoàn viên thường)
export const MANAGER_ROLES = [
  'ADMIN',
  'QUAN_LY_KHOA',
  'PHO_QUAN_LY_KHOA',
  'QUAN_LY_CHI_DOAN',
  'PHO_CHI_DOAN',
  'DIEM_DANH_VIEN',
  'QUAN_LY_CLB',
];

// Permissions — values MUST match Permission.name in DB (V_permissions_cleanup.sql)
// ID cố định 1-58, tham chiếu PERMISSIONS_REFERENCE.md để biết chi tiết
export const PERMISSIONS = {
  // ─── HE_THONG (id 1-4) ────────────────────────────────────────────────────
  DOI_MAT_KHAU:                    'DOI_MAT_KHAU',                   // 1
  XEM_THONG_TIN_CA_NHAN:           'XEM_THONG_TIN_CA_NHAN',          // 2
  SUA_THONG_TIN_CA_NHAN:           'SUA_THONG_TIN_CA_NHAN',          // 3
  CAI_DAT_HE_THONG:                'CAI_DAT_HE_THONG',               // 4

  // ─── SINH_VIEN (id 5-9) ───────────────────────────────────────────────────
  XEM_SINH_VIEN:                   'XEM_SINH_VIEN',                  // 5
  THEM_SINH_VIEN:                  'THEM_SINH_VIEN',                 // 6
  SUA_SINH_VIEN:                   'SUA_SINH_VIEN',                  // 7
  XOA_SINH_VIEN:                   'XOA_SINH_VIEN',                  // 8
  IMPORT_SINH_VIEN:                'IMPORT_SINH_VIEN',               // 9

  // ─── GIANG_VIEN (id 10-13) ────────────────────────────────────────────────
  XEM_GIANG_VIEN:                  'XEM_GIANG_VIEN',                 // 10
  THEM_GIANG_VIEN:                 'THEM_GIANG_VIEN',                // 11
  SUA_GIANG_VIEN:                  'SUA_GIANG_VIEN',                 // 12
  XOA_GIANG_VIEN:                  'XOA_GIANG_VIEN',                 // 13

  // ─── CHUYEN_VIEN (id 14-15) ───────────────────────────────────────────────
  XEM_CHUYEN_VIEN:                 'XEM_CHUYEN_VIEN',                // 14
  CAI_DAT_CHUYEN_VIEN:             'CAI_DAT_CHUYEN_VIEN',           // 15

  // ─── TO_CHUC (id 16-27) ───────────────────────────────────────────────────
  XEM_KHOA:                        'XEM_KHOA',                       // 16
  CAI_DAT_KHOA:                    'CAI_DAT_KHOA',                   // 17 (cũ: QUAN_LY_KHOA)
  XEM_NGANH:                       'XEM_NGANH',                      // 18
  CAI_DAT_NGANH:                   'CAI_DAT_NGANH',                  // 19
  XEM_LOP:                         'XEM_LOP',                        // 20
  CAI_DAT_LOP:                     'CAI_DAT_LOP',                    // 21
  XEM_KHOA_HOC:                    'XEM_KHOA_HOC',                   // 22
  CAI_DAT_KHOA_HOC:                'CAI_DAT_KHOA_HOC',               // 23
  XEM_HOC_KY:                      'XEM_HOC_KY',                     // 24
  CAI_DAT_HOC_KY:                  'CAI_DAT_HOC_KY',                 // 25
  XEM_NAM_HOC:                     'XEM_NAM_HOC',                    // 26
  CAI_DAT_NAM_HOC:                 'CAI_DAT_NAM_HOC',                // 27

  // ─── HOAT_DONG (id 28-36) ─────────────────────────────────────────────────
  XEM_HOAT_DONG:                   'XEM_HOAT_DONG',                  // 28
  TAO_HOAT_DONG:                   'TAO_HOAT_DONG',                  // 29
  SUA_HOAT_DONG:                   'SUA_HOAT_DONG',                  // 30
  XOA_HOAT_DONG:                   'XOA_HOAT_DONG',                  // 31
  DUYET_HOAT_DONG:                 'DUYET_HOAT_DONG',                // 32
  DANG_KY_HOAT_DONG:               'DANG_KY_HOAT_DONG',              // 33
  HUY_DANG_KY_HOAT_DONG:          'HUY_DANG_KY_HOAT_DONG',          // 34
  XEM_LICH_SU_THAM_GIA:            'XEM_LICH_SU_THAM_GIA',           // 35
  QUAN_LY_DANG_KY:                 'QUAN_LY_DANG_KY',                // 36

  // ─── DIEM_DANH (id 37-40) ─────────────────────────────────────────────────
  QUET_QR:                         'QUET_QR',                        // 37
  PHAN_CONG_DIEM_DANH:             'PHAN_CONG_DIEM_DANH',            // 38
  XEM_DIEM_DANH:                   'XEM_DIEM_DANH',                  // 39
  CHINH_SUA_DIEM_DANH:             'CHINH_SUA_DIEM_DANH',            // 40

  // ─── BCH (id 41-46) ───────────────────────────────────────────────────────
  XEM_BCH:                         'XEM_BCH',                        // 41
  THEM_BCH:                        'THEM_BCH',                       // 42
  SUA_BCH:                         'SUA_BCH',                        // 43
  XOA_BCH:                         'XOA_BCH',                        // 44
  QUAN_LY_CHUC_VU:                 'QUAN_LY_CHUC_VU',                // 45
  QUAN_LY_BAN:                     'QUAN_LY_BAN',                    // 46

  // ─── TAI_KHOAN (id 47-51) ─────────────────────────────────────────────────
  XEM_TAI_KHOAN:                   'XEM_TAI_KHOAN',                  // 47
  DUYET_TAI_KHOAN:                 'DUYET_TAI_KHOAN',                // 48
  TAO_TAI_KHOAN:                   'TAO_TAI_KHOAN',                  // 49
  SUA_TAI_KHOAN:                   'SUA_TAI_KHOAN',                  // 50
  XOA_TAI_KHOAN:                   'XOA_TAI_KHOAN',                  // 51

  // ─── PHAN_QUYEN (id 52-53) ────────────────────────────────────────────────
  QUAN_LY_PHAN_QUYEN_NHOM:         'QUAN_LY_PHAN_QUYEN_NHOM',        // 52
  QUAN_LY_PHAN_QUYEN_TAI_KHOAN:    'QUAN_LY_PHAN_QUYEN_TAI_KHOAN',   // 53

  // ─── BAO_CAO (id 54-56) ───────────────────────────────────────────────────
  XEM_BAO_CAO:                     'XEM_BAO_CAO',                    // 54
  XUAT_BAO_CAO:                    'XUAT_BAO_CAO',                   // 55
  XEM_THONG_KE:                    'XEM_THONG_KE',                   // 56

  // ─── SYSTEM (id 57-58) ────────────────────────────────────────────────────
  XEM_SYSTEM_LOG:                  'XEM_SYSTEM_LOG',                 // 57
  XUAT_SYSTEM_LOG:                 'XUAT_SYSTEM_LOG',                // 58

  // ─── KY_SO (id 59) ────────────────────────────────────────────────────────
  KY_SO_PDF:                        'KY_SO_PDF',                      // 59

  // ─── CLB (id 60-63, 77-79) ─────────────────────────────────────────────────
  XEM_CLB:                         'XEM_CLB',                        // 60
  THEM_CLB:                        'THEM_CLB',                       // 61
  SUA_CLB:                         'SUA_CLB',                        // 62
  XOA_CLB:                         'XOA_CLB',                        // 63
  QUAN_LY_CLB:                     'QUAN_LY_CLB',                    // 75 – Tạo/sửa/xóa CLB
  QUAN_LY_THANH_VIEN_CLB:          'QUAN_LY_THANH_VIEN_CLB',         // 76 – Quản lý thành viên CLB
  DUYET_THANH_VIEN_CLB:            'DUYET_THANH_VIEN_CLB',           // 77 – Duyệt đơn đăng ký CLB
  CAU_HINH_CLB:                    'CAU_HINH_CLB',                   // 78 – Cấu hình CLB
  DANG_KY_CLB:                     'DANG_KY_CLB',                    // 79 – Sinh viên đăng ký CLB
  QUAN_LY_BCN_CLB:                 'QUAN_LY_BCN_CLB',                // 80 – Quản lý Ban Chủ Nhiệm CLB
  DUYET_HOAT_DONG_CLB:             'DUYET_HOAT_DONG_CLB',            // 81 – Phê duyệt hoạt động CLB/Khoa

  // ─── CUOC_THI (Competition & Voting) ─────────────────────────────────────
  QUAN_LY_CUOC_THI:                'QUAN_LY_CUOC_THI',
  TAO_CUOC_THI:                    'TAO_CUOC_THI',
  SUA_CUOC_THI:                    'SUA_CUOC_THI',
  XOA_CUOC_THI:                    'XOA_CUOC_THI',

  // ─── NEWS / eNews ─────────────────────────────────────────────────────────
  DANG_TIN_TUC:                    'DANG_TIN_TUC',
  SUA_TIN_TUC:                     'SUA_TIN_TUC',
  XOA_TIN_TUC:                     'XOA_TIN_TUC',
  DUYET_TIN_TUC:                   'DUYET_TIN_TUC',
  QUAN_LY_CHUYEN_MUC:              'QUAN_LY_CHUYEN_MUC',
  QUAN_LY_VAN_BAN:                 'QUAN_LY_VAN_BAN',
  XOA_VAN_BAN:                     'XOA_VAN_BAN',

  // ─── Aliases giữ tương thích ngược với code cũ ────────────────────────────
  // (value đã được sửa để khớp DB — cập nhật dần references sang tên mới)
  VIEW_SINH_VIEN:                  'XEM_SINH_VIEN',
  MANAGE_SINH_VIEN:                'THEM_SINH_VIEN',
  VIEW_GIANG_VIEN:                 'XEM_GIANG_VIEN',
  MANAGE_GIANG_VIEN:               'XEM_CHUYEN_VIEN',
  VIEW_BCH:                        'XEM_BCH',
  MANAGE_BCH:                      'QUAN_LY_CHUC_VU',
  VIEW_TAI_KHOAN:                  'XEM_TAI_KHOAN',
  VIEW_THONG_KE:                   'XEM_THONG_KE',
  VIEW_SYSTEM_LOG:                 'XEM_SYSTEM_LOG',
  EXPORT_SYSTEM_LOG:               'XUAT_SYSTEM_LOG',
  EXPORT_BAO_CAO:                  'XUAT_BAO_CAO',
  VIEW_BAO_CAO:                    'XEM_BAO_CAO',
  MANAGE_DIEM_DANH:                'XEM_DIEM_DANH',
  MANAGE_ROLE_PERMISSIONS:         'QUAN_LY_PHAN_QUYEN_NHOM',
  MANAGE_ACCOUNT_PERMISSIONS:      'QUAN_LY_PHAN_QUYEN_TAI_KHOAN',

  // ─── Aliases cho tài khoản (giữ tương thích với code cũ) ──────────────────
  APPROVE_TAI_KHOAN:               'DUYET_TAI_KHOAN',
  CREATE_TAI_KHOAN:                'TAO_TAI_KHOAN',
  EDIT_TAI_KHOAN:                  'SUA_TAI_KHOAN',
  DELETE_TAI_KHOAN:                'XOA_TAI_KHOAN',
};

// Activity Status
export const ACTIVITY_STATUS = {
  CHUA_MO_DANG_KY: 'CHUA_MO_DANG_KY',
  MO_DANG_KY: 'MO_DANG_KY',
  DONG_DANG_KY: 'DONG_DANG_KY',
  DANG_DIEN_RA: 'DANG_DIEN_RA',
  DA_KET_THUC: 'DA_KET_THUC',
  DA_HUY: 'DA_HUY',
};

// Activity Status Labels
export const ACTIVITY_STATUS_LABELS = {
  [ACTIVITY_STATUS.CHUA_MO_DANG_KY]: 'Chưa mở đăng ký',
  [ACTIVITY_STATUS.MO_DANG_KY]: 'Mở đăng ký',
  [ACTIVITY_STATUS.DONG_DANG_KY]: 'Đóng đăng ký',
  [ACTIVITY_STATUS.DANG_DIEN_RA]: 'Đang diễn ra',
  [ACTIVITY_STATUS.DA_KET_THUC]: 'Đã kết thúc',
  [ACTIVITY_STATUS.DA_HUY]: 'Đã hủy',
};

// Activity Status Colors
export const ACTIVITY_STATUS_COLORS = {
  [ACTIVITY_STATUS.CHUA_MO_DANG_KY]: 'bg-gray-100 text-gray-800',
  [ACTIVITY_STATUS.MO_DANG_KY]: 'bg-green-100 text-green-800',
  [ACTIVITY_STATUS.DONG_DANG_KY]: 'bg-yellow-100 text-yellow-800',
  [ACTIVITY_STATUS.DANG_DIEN_RA]: 'bg-blue-100 text-blue-800',
  [ACTIVITY_STATUS.DA_KET_THUC]: 'bg-purple-100 text-purple-800',
  [ACTIVITY_STATUS.DA_HUY]: 'bg-red-100 text-red-800',
};

// Activity Types
export const ACTIVITY_TYPES = {
  HOI_THAO: 'HOI_THAO',
  CHUYEN_DE: 'CHUYEN_DE',
  TINH_NGUYEN: 'TINH_NGUYEN',
  VAN_HOA_NGHE_THUAT: 'VAN_HOA_NGHE_THUAT',
  THE_THAO: 'THE_THAO',
  HOC_THUAT: 'HOC_THUAT',
  KHAC: 'KHAC',
};

// Activity Type Labels
export const ACTIVITY_TYPE_LABELS = {
  [ACTIVITY_TYPES.HOI_THAO]: 'Hội thảo',
  [ACTIVITY_TYPES.CHUYEN_DE]: 'Chuyên đề',
  [ACTIVITY_TYPES.TINH_NGUYEN]: 'Tình nguyện',
  [ACTIVITY_TYPES.VAN_HOA_NGHE_THUAT]: 'Văn hóa - Nghệ thuật',
  [ACTIVITY_TYPES.THE_THAO]: 'Thể thao',
  [ACTIVITY_TYPES.HOC_THUAT]: 'Học thuật',
  [ACTIVITY_TYPES.KHAC]: 'Khác',
};

// Activity Levels — PHẢI khớp với CapDoEnum.java ở backend
export const ACTIVITY_LEVELS = {
  DOAN_TRUONG:        'DOAN_TRUONG',
  HOI_SINH_VIEN:      'HOI_SINH_VIEN',
  TRUONG:             'TRUONG',
  PHONG:              'PHONG',
  KHOA:               'KHOA',
  CHI_DOAN:           'CHI_DOAN',
  BAN_DOI_CLB:        'BAN_DOI_CLB',
  TINH_DOAN:          'TINH_DOAN',
  HOAT_DONG_PHOI_HOP: 'HOAT_DONG_PHOI_HOP',
};

// Activity Level Labels
export const ACTIVITY_LEVEL_LABELS = {
  [ACTIVITY_LEVELS.DOAN_TRUONG]:        'Đoàn trường',
  [ACTIVITY_LEVELS.HOI_SINH_VIEN]:      'Hội sinh viên',
  [ACTIVITY_LEVELS.TRUONG]:             'Trường',
  [ACTIVITY_LEVELS.PHONG]:              'Phòng',
  [ACTIVITY_LEVELS.KHOA]:               'Khoa',
  [ACTIVITY_LEVELS.CHI_DOAN]:           'Chi đoàn',
  [ACTIVITY_LEVELS.BAN_DOI_CLB]:        'Ban - Đội - CLB',
  [ACTIVITY_LEVELS.TINH_DOAN]:          'Tỉnh đoàn',
  [ACTIVITY_LEVELS.HOAT_DONG_PHOI_HOP]: 'Hoạt động phối hợp',
};

// Attendance Status
export const ATTENDANCE_STATUS = {
  DA_DIEM_DANH: 'DA_DIEM_DANH',
  VANG_CO_PHEP: 'VANG_CO_PHEP',
  VANG_KHONG_PHEP: 'VANG_KHONG_PHEP',
};

// Attendance Status Labels
export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.DA_DIEM_DANH]: 'Đã điểm danh',
  [ATTENDANCE_STATUS.VANG_CO_PHEP]: 'Vắng có phép',
  [ATTENDANCE_STATUS.VANG_KHONG_PHEP]: 'Vắng không phép',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 10,
  SIZE_OPTIONS: [10, 20, 50, 100],
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_TIME: "yyyy-MM-dd'T'HH:mm:ss",
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  CHANGE_PASSWORD: '/change-password',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_TEACHERS: '/admin/teachers',
  ADMIN_GIANGVIEN: '/admin/giangvien',
  ADMIN_ACTIVITIES: '/admin/activities',
  ADMIN_KHOA: '/admin/khoa',
  ADMIN_NGANH: '/admin/nganh',
  ADMIN_LOP: '/admin/lop',
  ADMIN_KHOAHOC: '/admin/khoahoc',
  ADMIN_BCH: '/admin/bch',
  ADMIN_CHUYENVIEN: '/admin/chuyenvien',
  ADMIN_CHUC_VU: '/admin/chuc-vu',
  ADMIN_BAN: '/admin/ban',
  ADMIN_CAU_LAC_BO: '/admin/cau-lac-bo',
  ADMIN_ATTENDANCE: '/admin/attendance',
  ADMIN_CERTIFICATES: '/admin/certificates',
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_PHAN_QUYEN: '/admin/phan-quyen',
  ADMIN_PHAN_QUYEN_CLB: '/admin/phan-quyen-clb',
  ADMIN_CLB_PORTAL:     '/admin/clb-portal',
  ADMIN_ACCOUNTS: '/admin/accounts',
  ADMIN_ACCOUNT_STATISTICS: '/admin/account-statistics',
  ADMIN_SYSTEM_LOG: '/admin/system-log',
  ADMIN_NAM_HOC: '/admin/nam-hoc',

  // User routes
  PROFILE: '/profile',

  // Student routes
  STUDENT: '/student',
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_ACTIVITIES: '/student/activities',
  STUDENT_REGISTRATIONS: '/student/registrations',
  STUDENT_CERTIFICATES: '/student/certificates',
  STUDENT_PROFILE: '/student/profile',
  STUDENT_REGISTER_ACTIVITIES: '/student/register-activities',
  STUDENT_MY_ACTIVITIES: '/student/my-activities',
  STUDENT_TRAINING_POINTS: '/student/training-points',
  STUDENT_CLB_REGISTRATION: '/student/clb-registration',
  STUDENT_FEES: '/student/fees',
  STUDENT_CONTESTS: '/student/contests',

  // BCH routes
  BCH: '/bch',
  BCH_DASHBOARD: '/bch/dashboard',
  BCH_ACTIVITIES: '/bch/activities',
  BCH_DIEM_DANH: '/bch/diem-danh',
  BCH_ATTENDANCE: '/bch/attendance',
  BCH_SCAN_QR: '/bch/scan-qr',
  BCH_PHAN_QUYEN: '/bch/phan-quyen',

  // eNews — Public
  NEWS_HOME: '/news',

  // Cuộc thi & Bình chọn — Admin manage
  ADMIN_CUOC_THI: '/admin/cuoc-thi',
  // Public
  BINH_CHON: '/binh-chon',

  // eNews — Admin manage
  ADMIN_NEWS: '/admin/news',
  ADMIN_VAN_BAN: '/admin/van-ban',
  ADMIN_CHUYEN_MUC: '/admin/chuyen-muc',

  // eNews — BCH manage
  BCH_NEWS: '/bch/news',
  BCH_NEWS_CREATE: '/bch/news/create',
  BCH_VAN_BAN: '/bch/van-ban',
  BCH_VAN_BAN_CREATE: '/bch/van-ban/create',

  // Layout editors (admin only)
  ADMIN_LAYOUT_EDITOR:      '/admin/layout-editor',
  ADMIN_NEWS_LAYOUT_EDITOR: '/admin/news-layout-editor',

  // Content managers (admin only)
  ADMIN_SLIDER_MANAGER:     '/admin/slider-manager',
  ADMIN_TICKER_MANAGER:     '/admin/ticker-manager',
  ADMIN_AD_BANNER_MANAGER:  '/admin/ad-banner-manager',
  ADMIN_BIEU_MAU_MANAGER:   '/admin/bieu-mau',

  // Ký số
  ADMIN_CHU_KY:        '/admin/chu-ky',
  ADMIN_CON_DAU:       '/admin/con-dau',
  ADMIN_KY_SO_LICH_SU: '/admin/ky-so-lich-su',
  ADMIN_BAN_HANH:      '/admin/ban-hanh',

  // Email config
  ADMIN_EMAIL_CONFIG: '/admin/cau-hinh-email',
};
