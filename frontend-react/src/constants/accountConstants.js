/**
 * Constants cho hệ thống quản lý tài khoản
 */

// ========== VAI TRÒ (Roles) ==========

export const ROLE_GROUPS = {
  QUAN_LY: 'QUAN_LY',      // Management
  PHU_VU: 'PHU_VU',        // Service
  THAM_GIA: 'THAM_GIA'     // Participation
};

export const ROLE_GROUP_LABELS = {
  QUAN_LY: 'Quản lý',
  PHU_VU: 'Phục vụ',
  THAM_GIA: 'Thành viên'
};

export const ORGANIZATIONS = {
  DOAN: 'DOAN',            // Union
  HOI: 'HOI',              // Association
  HE_THONG: 'HE_THONG'     // System
};

export const ORGANIZATION_LABELS = {
  DOAN: 'Đoàn',
  HOI: 'Hội',
  HE_THONG: 'Hệ thống'
};

// ========== MANAGEMENT ROLES - UNION (ĐOÀN) ==========
// Cấp 1: Thường trực (Lãnh đạo cao nhất)
export const ROLE_BI_THU_DOAN = 'BI_THU_DOAN';
export const ROLE_PHO_BI_THU_DOAN = 'PHO_BI_THU_DOAN';

// Cấp 2: Ban Thường vụ (Lãnh đạo thường xuyên)
export const ROLE_UY_VIEN_THUONG_VU_DOAN = 'UY_VIEN_THUONG_VU_DOAN';

// Cấp 3: Ban Chấp hành (Cơ quan lãnh đạo)
export const ROLE_UY_VIEN_CHAP_HANH_DOAN = 'UY_VIEN_CHAP_HANH_DOAN';

// Cấp 4: Chuyên môn
export const ROLE_CAN_BO_VAN_PHONG_DOAN = 'CAN_BO_VAN_PHONG_DOAN';
export const ROLE_THU_KY_HANH_CHINH_DOAN = 'THU_KY_HANH_CHINH_DOAN';

// ========== MANAGEMENT ROLES - ASSOCIATION (HỘI) ==========
// Cấp 1: Thường trực (Lãnh đạo cao nhất)
export const ROLE_CHU_TICH_HOI = 'CHU_TICH_HOI';
export const ROLE_PHO_CHU_TICH_HOI = 'PHO_CHU_TICH_HOI';

// Cấp 2: Ban Thư ký (Cơ quan điều hành thường xuyên)
export const ROLE_UY_VIEN_THU_KY_HOI = 'UY_VIEN_THU_KY_HOI';

// Cấp 3: Ban Chấp hành (Cơ quan lãnh đạo)
export const ROLE_UY_VIEN_CHAP_HANH_HOI = 'UY_VIEN_CHAP_HANH_HOI';

// ========== SERVICE ROLES - UNION (PHỤC VỤ ĐOÀN) ==========
export const ROLE_TRUONG_BAN_DOAN = 'TRUONG_BAN_DOAN';
export const ROLE_PHO_TRUONG_BAN_DOAN = 'PHO_TRUONG_BAN_DOAN';
export const ROLE_UV_BAN_DOAN = 'UV_BAN_DOAN';

// ========== SERVICE ROLES - ASSOCIATION (PHỤC VỤ HỘI) ==========
export const ROLE_TRUONG_BAN_HOI = 'TRUONG_BAN_HOI';
export const ROLE_PHO_TRUONG_BAN_HOI = 'PHO_TRUONG_BAN_HOI';
export const ROLE_UV_BAN_HOI = 'UV_BAN_HOI';

// ========== PARTICIPATION ROLES ==========
export const ROLE_THANH_VIEN_DOAN = 'THANH_VIEN_DOAN';
export const ROLE_THANH_VIEN_HOI = 'THANH_VIEN_HOI';

// ========== SPECIAL ROLES ==========
export const ROLE_ADMIN = 'ADMIN';
export const ROLE_GIANG_VIEN_HUONG_DAN = 'GIANG_VIEN_HUONG_DAN';
export const ROLE_GIANGVIEN = 'GIANGVIEN';
export const ROLE_SINHVIEN = 'SINHVIEN';

export const ROLE_LABELS = {
  // Management - Union (Đoàn)
  BI_THU_DOAN: 'Bí thư Đoàn',
  PHO_BI_THU_DOAN: 'Phó Bí thư Đoàn',
  UY_VIEN_THUONG_VU_DOAN: 'Ủy viên Ban Thường vụ',
  UY_VIEN_CHAP_HANH_DOAN: 'Ủy viên Ban Chấp hành',
  CAN_BO_VAN_PHONG_DOAN: 'Cán bộ Văn phòng Đoàn',
  THU_KY_HANH_CHINH_DOAN: 'Thư ký hành chính Đoàn',

  // Management - Association (Hội)
  CHU_TICH_HOI: 'Chủ tịch Hội',
  PHO_CHU_TICH_HOI: 'Phó chủ tịch Hội',
  UY_VIEN_THU_KY_HOI: 'Ủy viên Ban Thư ký',
  UY_VIEN_CHAP_HANH_HOI: 'Ủy viên Ban Chấp hành',

  // Service - Union
  TRUONG_BAN_DOAN: 'Trưởng Ban Đoàn',
  PHO_TRUONG_BAN_DOAN: 'Phó Trưởng Ban Đoàn',
  UV_BAN_DOAN: 'Ủy viên Ban Đoàn',

  // Service - Association
  TRUONG_BAN_HOI: 'Trưởng Ban Hội',
  PHO_TRUONG_BAN_HOI: 'Phó Trưởng Ban Hội',
  UV_BAN_HOI: 'Ủy viên Ban Hội',

  // Participation
  THANH_VIEN_DOAN: 'Thành viên Đoàn',
  THANH_VIEN_HOI: 'Thành viên Hội',

  // Special
  ADMIN: 'Admin',
  GIANG_VIEN_HUONG_DAN: 'Giảng viên hướng dẫn',
  GIANGVIEN: 'Giảng viên',
  SINHVIEN: 'Sinh viên'
};

// ========== BAN CHUYÊN MÔN (Departments) ==========

export const DEPARTMENT_DOAN = {
  BAN_TUYEN_TRUYEN_DOAN: 'BAN_TUYEN_TRUYEN_DOAN',
  BAN_THANH_NIEN_XUNG_PHONG_DOAN: 'BAN_THANH_NIEN_XUNG_PHONG_DOAN',
  BAN_HOC_TAP_NGHE_NGHIEP_DOAN: 'BAN_HOC_TAP_NGHE_NGHIEP_DOAN',
  BAN_THE_THAO_DOAN: 'BAN_THE_THAO_DOAN',
  BAN_VAN_HOA_DOAN: 'BAN_VAN_HOA_DOAN',
  BAN_GIAO_LUU_HOP_TAC_DOAN: 'BAN_GIAO_LUU_HOP_TAC_DOAN'
};

export const DEPARTMENT_HOI = {
  BAN_TU_VAN_HOI: 'BAN_TU_VAN_HOI',
  BAN_DAO_TAO_HO_TRO_HOI: 'BAN_DAO_TAO_HO_TRO_HOI',
  BAN_CHUONG_TRINH_HOI: 'BAN_CHUONG_TRINH_HOI',
  BAN_DIEN_TRA_GIAI_QUYET_HOI: 'BAN_DIEN_TRA_GIAI_QUYET_HOI',
  BAN_TU_THUONG_HOI: 'BAN_TU_THUONG_HOI'
};

export const DEPARTMENT_LABELS = {
  // Đoàn
  BAN_TUYEN_TRUYEN_DOAN: 'Ban Tuyên truyền',
  BAN_THANH_NIEN_XUNG_PHONG_DOAN: 'Ban Thanh niên xung phong',
  BAN_HOC_TAP_NGHE_NGHIEP_DOAN: 'Ban Học tập - Nghề nghiệp',
  BAN_THE_THAO_DOAN: 'Ban Thể thao',
  BAN_VAN_HOA_DOAN: 'Ban Văn hóa',
  BAN_GIAO_LUU_HOP_TAC_DOAN: 'Ban Giao lưu - Hợp tác',

  // Hội
  BAN_TU_VAN_HOI: 'Ban Tư vấn',
  BAN_DAO_TAO_HO_TRO_HOI: 'Ban Đào tạo - Hỗ trợ',
  BAN_CHUONG_TRINH_HOI: 'Ban Chương trình',
  BAN_DIEN_TRA_GIAI_QUYET_HOI: 'Ban Điều tra - Giải quyết',
  BAN_TU_THUONG_HOI: 'Ban Tư tưởng'
};

// ========== APPROVAL STATUS ==========

export const APPROVAL_STATUS = {
  PENDING: 'CHO_PHE_DUYET',
  APPROVED: 'DA_PHE_DUYET',
  REJECTED: 'TU_CHOI'
};

export const APPROVAL_STATUS_LABELS = {
  CHO_PHE_DUYET: 'Chờ phê duyệt',
  DA_PHE_DUYET: 'Đã phê duyệt',
  TU_CHOI: 'Từ chối'
};

export const APPROVAL_STATUS_COLORS = {
  CHO_PHE_DUYET: '#FFC107',  // warning (yellow)
  DA_PHE_DUYET: '#28A745',   // success (green)
  TU_CHOI: '#DC3545'         // danger (red)
};

// ========== GENDER ==========

export const GENDER = {
  MALE: 'NAM',
  FEMALE: 'NU',
  OTHER: 'KHAC'
};

export const GENDER_LABELS = {
  NAM: 'Nam',
  NU: 'Nữ',
  KHAC: 'Khác'
};

// ========== VALIDATION PATTERNS ==========

export const EMAIL_PATTERN = /^[A-Za-z0-9+_.-]+@vnkgu\.edu\.vn$/i;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,50}$/;
export const PHONE_PATTERN = /^(\+84|0)[0-9]{9,10}$/;

// ========== MESSAGES ==========

export const ERROR_MESSAGES = {
  EMAIL_INVALID: 'Email không hợp lệ. Vui lòng sử dụng email @vnkgu.edu.vn',
  EMAIL_REQUIRED: 'Email không được để trống',
  USERNAME_INVALID: 'Tên đăng nhập phải chứa 3-50 ký tự (chữ, số, dấu gạch dưới)',
  USERNAME_REQUIRED: 'Tên đăng nhập không được để trống',
  PASSWORD_INVALID: 'Mật khẩu phải có ít nhất 6 ký tự',
  PASSWORD_REQUIRED: 'Mật khẩu không được để trống',
  PASSWORD_CONFIRM_MISMATCH: 'Mật khẩu xác nhận không khớp',
  HO_TEN_REQUIRED: 'Họ tên không được để trống',
  PHONE_INVALID: 'Số điện thoại không hợp lệ',
  REGISTRATION_SUCCESS: 'Đăng ký thành công. Vui lòng chờ phê duyệt từ quản trị viên.',
  REGISTRATION_ERROR: 'Lỗi đăng ký tài khoản'
};

// ========== API ENDPOINTS ==========

export const ACCOUNT_API = {
  REGISTER: '/api/accounts/register',
  CREATE_MANUAL: '/api/accounts/create-manual',
  GET_BY_ID: (id) => `/api/accounts/${id}`,
  UPDATE_PROFILE: (id) => `/api/accounts/${id}/profile`,
  APPROVE: (id) => `/api/accounts/${id}/approve`,
  REJECT: (id) => `/api/accounts/${id}/reject`,
  CHANGE_ROLE: (id) => `/api/accounts/${id}/role`,
  SET_ACTIVE: (id) => `/api/accounts/${id}/active`,
  PENDING_APPROVAL: '/api/accounts/pending-approval',
  SEARCH: '/api/accounts/search',
  BY_ROLE: (role) => `/api/accounts/by-role/${role}`,
  STATISTICS_SYSTEM: '/api/accounts/statistics/system',
  STATISTICS_PENDING_COUNT: '/api/accounts/statistics/pending-count',
  STATISTICS_BY_ROLE: '/api/accounts/statistics/by-role',
  STATISTICS_BY_ORGANIZATION: '/api/accounts/statistics/by-organization'
};

// ========== ROLE OPTIONS FOR DROPDOWNS ==========

export const ROLE_OPTIONS = [
  // Management - Union (Đoàn)
  { value: 'BI_THU_DOAN', label: 'Bí thư Đoàn', group: 'Quản lý - Đoàn' },
  { value: 'PHO_BI_THU_DOAN', label: 'Phó Bí thư Đoàn', group: 'Quản lý - Đoàn' },
  { value: 'UY_VIEN_THUONG_VU_DOAN', label: 'Ủy viên Ban Thường vụ', group: 'Quản lý - Đoàn' },
  { value: 'UY_VIEN_CHAP_HANH_DOAN', label: 'Ủy viên Ban Chấp hành', group: 'Quản lý - Đoàn' },
  { value: 'CAN_BO_VAN_PHONG_DOAN', label: 'Cán bộ Văn phòng Đoàn', group: 'Quản lý - Đoàn' },
  { value: 'THU_KY_HANH_CHINH_DOAN', label: 'Thư ký hành chính Đoàn', group: 'Quản lý - Đoàn' },

  // Management - Association (Hội)
  { value: 'CHU_TICH_HOI', label: 'Chủ tịch Hội', group: 'Quản lý - Hội' },
  { value: 'PHO_CHU_TICH_HOI', label: 'Phó chủ tịch Hội', group: 'Quản lý - Hội' },
  { value: 'UY_VIEN_THU_KY_HOI', label: 'Ủy viên Ban Thư ký', group: 'Quản lý - Hội' },
  { value: 'UY_VIEN_CHAP_HANH_HOI', label: 'Ủy viên Ban Chấp hành', group: 'Quản lý - Hội' },

  // Service - Union (Phục vụ Đoàn)
  { value: 'TRUONG_BAN_DOAN', label: 'Trưởng Ban Đoàn', group: 'Phục vụ - Đoàn' },
  { value: 'PHO_TRUONG_BAN_DOAN', label: 'Phó Trưởng Ban Đoàn', group: 'Phục vụ - Đoàn' },
  { value: 'UV_BAN_DOAN', label: 'Ủy viên Ban Đoàn', group: 'Phục vụ - Đoàn' },

  // Service - Association (Phục vụ Hội)
  { value: 'TRUONG_BAN_HOI', label: 'Trưởng Ban Hội', group: 'Phục vụ - Hội' },
  { value: 'PHO_TRUONG_BAN_HOI', label: 'Phó Trưởng Ban Hội', group: 'Phục vụ - Hội' },
  { value: 'UV_BAN_HOI', label: 'Ủy viên Ban Hội', group: 'Phục vụ - Hội' },

  // Participation
  { value: 'THANH_VIEN_DOAN', label: 'Thành viên Đoàn', group: 'Thành viên' },
  { value: 'THANH_VIEN_HOI', label: 'Thành viên Hội', group: 'Thành viên' },

  // Special
  { value: 'GIANG_VIEN_HUONG_DAN', label: 'Giảng viên hướng dẫn', group: 'Đặc biệt' },
  { value: 'GIANGVIEN', label: 'Giảng viên', group: 'Đặc biệt' },
  { value: 'SINHVIEN', label: 'Sinh viên', group: 'Đặc biệt' }
];

// ========== DEPARTMENT OPTIONS FOR DROPDOWNS ==========

export const DEPARTMENT_OPTIONS = [
  // Đoàn
  { value: 'BAN_TUYEN_TRUYEN_DOAN', label: 'Ban Tuyên truyền', organization: 'DOAN' },
  { value: 'BAN_THANH_NIEN_XUNG_PHONG_DOAN', label: 'Ban Thanh niên xung phong', organization: 'DOAN' },
  { value: 'BAN_HOC_TAP_NGHE_NGHIEP_DOAN', label: 'Ban Học tập - Nghề nghiệp', organization: 'DOAN' },
  { value: 'BAN_THE_THAO_DOAN', label: 'Ban Thể thao', organization: 'DOAN' },
  { value: 'BAN_VAN_HOA_DOAN', label: 'Ban Văn hóa', organization: 'DOAN' },
  { value: 'BAN_GIAO_LUU_HOP_TAC_DOAN', label: 'Ban Giao lưu - Hợp tác', organization: 'DOAN' },

  // Hội
  { value: 'BAN_TU_VAN_HOI', label: 'Ban Tư vấn', organization: 'HOI' },
  { value: 'BAN_DAO_TAO_HO_TRO_HOI', label: 'Ban Đào tạo - Hỗ trợ', organization: 'HOI' },
  { value: 'BAN_CHUONG_TRINH_HOI', label: 'Ban Chương trình', organization: 'HOI' },
  { value: 'BAN_DIEN_TRA_GIAI_QUYET_HOI', label: 'Ban Điều tra - Giải quyết', organization: 'HOI' },
  { value: 'BAN_TU_THUONG_HOI', label: 'Ban Tư tưởng', organization: 'HOI' }
];
