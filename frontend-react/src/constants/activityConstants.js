// Loại hoạt động
export const LOAI_HOAT_DONG = {
  HOI_THAO: { value: 'HOI_THAO', label: 'Hội thảo', color: '#3B82F6' },
  SINH_HOAT: { value: 'SINH_HOAT', label: 'Sinh hoạt', color: '#10B981' },
  THAM_QUAN: { value: 'THAM_QUAN', label: 'Tham quan', color: '#F59E0B' },
  TINH_NGUYEN: { value: 'TINH_NGUYEN', label: 'Tình nguyện', color: '#EF4444' },
  VAN_HOA_VAN_NGHE: { value: 'VAN_HOA_VAN_NGHE', label: 'Văn hóa văn nghệ', color: '#8B5CF6' },
  THE_THAO: { value: 'THE_THAO', label: 'Thể thao', color: '#EC4899' },
  HOC_TAP: { value: 'HOC_TAP', label: 'Học tập', color: '#6366F1' },
  KHAC: { value: 'KHAC', label: 'Khác', color: '#6B7280' },
};

export const LOAI_HOAT_DONG_OPTIONS = Object.values(LOAI_HOAT_DONG);

// Cấp độ
export const CAP_DO = {
  KHOA: { value: 'KHOA', label: 'Khoa', color: '#3B82F6' },
  TRUONG: { value: 'TRUONG', label: 'Trường', color: '#10B981' },
  DOAN_TRUONG: { value: 'DOAN_TRUONG', label: 'Đoàn trường', color: '#F59E0B' },
  THANH_PHO: { value: 'THANH_PHO', label: 'Thành phố', color: '#EF4444' },
  QUOC_GIA: { value: 'QUOC_GIA', label: 'Quốc gia', color: '#8B5CF6' },
};

export const CAP_DO_OPTIONS = Object.values(CAP_DO);

// Trạng thái hoạt động
export const TRANG_THAI_HOAT_DONG = {
  SAP_DIEN_RA: { value: 'SAP_DIEN_RA', label: 'Sắp diễn ra', color: '#3B82F6', badge: 'info' },
  DANG_MO_DANG_KY: { value: 'DANG_MO_DANG_KY', label: 'Đang mở đăng ký', color: '#10B981', badge: 'success' },
  DANG_DIEN_RA: { value: 'DANG_DIEN_RA', label: 'Đang diễn ra', color: '#F59E0B', badge: 'warning' },
  DA_HOAN_THANH: { value: 'DA_HOAN_THANH', label: 'Đã hoàn thành', color: '#6B7280', badge: 'secondary' },
  DA_HUY: { value: 'DA_HUY', label: 'Đã hủy', color: '#EF4444', badge: 'danger' },
};

export const TRANG_THAI_OPTIONS = Object.values(TRANG_THAI_HOAT_DONG);

// Helper functions
export const getLoaiHoatDongLabel = (value) => {
  return LOAI_HOAT_DONG[value]?.label || value;
};

export const getLoaiHoatDongColor = (value) => {
  return LOAI_HOAT_DONG[value]?.color || '#6B7280';
};

export const getCapDoLabel = (value) => {
  return CAP_DO[value]?.label || value;
};

export const getCapDoColor = (value) => {
  return CAP_DO[value]?.color || '#6B7280';
};

export const getTrangThaiLabel = (value) => {
  return TRANG_THAI_HOAT_DONG[value]?.label || value;
};

export const getTrangThaiBadgeVariant = (value) => {
  return TRANG_THAI_HOAT_DONG[value]?.badge || 'secondary';
};

export const getTrangThaiColor = (value) => {
  return TRANG_THAI_HOAT_DONG[value]?.color || '#6B7280';
};

// Time constants
export const DEFAULT_CHECK_IN_EARLY = 30; // phút
export const DEFAULT_MAX_LATE_TIME = 15; // phút
export const DEFAULT_MIN_PARTICIPATION_TIME = 120; // phút
