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

// ========== SYSTEM ROLES (VAI TRÒ HỆ THỐNG) ==========
export const ROLE_ADMIN = 'ADMIN';
export const ROLE_GIANG_VIEN = 'GIANG_VIEN';
export const ROLE_SINH_VIEN = 'SINH_VIEN';
export const ROLE_CHUYEN_VIEN = 'CHUYEN_VIEN';

// ========== EFFECTIVE ROLES (VAI TRÒ HIỆU LỰC) ==========
export const ROLE_MANAGER = 'MANAGER';
export const ROLE_STAFF = 'STAFF';

// Backward compatibility aliases
export const ROLE_GIANGVIEN = 'GIANG_VIEN';
export const ROLE_SINHVIEN = 'SINH_VIEN';

export const ROLE_LABELS = {
  SINH_VIEN: 'Sinh viên',
  QUAN_LY: 'Quản lý',
  // Legacy — giữ tương thích ngược
  ADMIN: 'Quản trị viên',
  BCH: 'Quản lý',
  GIANG_VIEN: 'Quản lý',
  CHUYEN_VIEN: 'Quản lý',
  MANAGER: 'Quản lý',
  STAFF: 'Quản lý',
  GIANGVIEN: 'Quản lý',
  SINHVIEN: 'Sinh viên',
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

export const
    DEPARTMENT_HOI = {
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
  { value: 'SINH_VIEN', label: 'Sinh viên' },
  { value: 'QUAN_LY',   label: 'Quản lý' },
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
