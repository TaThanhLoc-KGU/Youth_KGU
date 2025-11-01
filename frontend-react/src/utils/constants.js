// User Roles
export const ROLES = {
  ADMIN: 'ADMIN',
  BCH: 'BCH',
  SINHVIEN: 'SINHVIEN',
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

// Activity Levels
export const ACTIVITY_LEVELS = {
  TRUONG: 'TRUONG',
  KHOA: 'KHOA',
  TINH_THANH: 'TINH_THANH',
  QUOC_GIA: 'QUOC_GIA',
  QUOC_TE: 'QUOC_TE',
};

// Activity Level Labels
export const ACTIVITY_LEVEL_LABELS = {
  [ACTIVITY_LEVELS.TRUONG]: 'Cấp trường',
  [ACTIVITY_LEVELS.KHOA]: 'Cấp khoa',
  [ACTIVITY_LEVELS.TINH_THANH]: 'Cấp tỉnh/thành',
  [ACTIVITY_LEVELS.QUOC_GIA]: 'Cấp quốc gia',
  [ACTIVITY_LEVELS.QUOC_TE]: 'Cấp quốc tế',
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

  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_TEACHERS: '/admin/teachers',
  ADMIN_ACTIVITIES: '/admin/activities',
  ADMIN_KHOA: '/admin/khoa',
  ADMIN_NGANH: '/admin/nganh',
  ADMIN_LOP: '/admin/lop',
  ADMIN_BCH: '/admin/bch',
  ADMIN_ATTENDANCE: '/admin/attendance',
  ADMIN_CERTIFICATES: '/admin/certificates',
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_SETTINGS: '/admin/settings',

  // Student routes
  STUDENT: '/student',
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_ACTIVITIES: '/student/activities',
  STUDENT_REGISTRATIONS: '/student/registrations',
  STUDENT_CERTIFICATES: '/student/certificates',
  STUDENT_PROFILE: '/student/profile',

  // BCH routes
  BCH: '/bch',
  BCH_DASHBOARD: '/bch/dashboard',
  BCH_ACTIVITIES: '/bch/activities',
  BCH_ATTENDANCE: '/bch/attendance',
  BCH_SCAN_QR: '/bch/scan-qr',
};
