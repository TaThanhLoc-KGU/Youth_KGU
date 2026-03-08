// Loại hoạt động — PHẢI khớp với LoaiHoatDongEnum.java ở backend
export const LOAI_HOAT_DONG = {
  CHINH_TRI:         { value: 'CHINH_TRI',         label: 'Chính trị',           color: '#3B82F6' },
  VAN_HOA_NGHE_THUAT:{ value: 'VAN_HOA_NGHE_THUAT',label: 'Văn hóa - Nghệ thuật', color: '#8B5CF6' },
  THE_THAO:          { value: 'THE_THAO',           label: 'Thể thao',            color: '#EC4899' },
  TINH_NGUYEN:       { value: 'TINH_NGUYEN',        label: 'Tình nguyện',         color: '#EF4444' },
  HOC_THUAT:         { value: 'HOC_THUAT',          label: 'Học thuật',           color: '#6366F1' },
  KY_NANG_MEM:       { value: 'KY_NANG_MEM',        label: 'Kỹ năng mềm',        color: '#F59E0B' },
  DOAN_HOI:          { value: 'DOAN_HOI',           label: 'Đoàn - Hội',          color: '#10B981' },
  CONG_DONG:         { value: 'CONG_DONG',          label: 'Cộng đồng',           color: '#06B6D4' },
  KHAC:              { value: 'KHAC',               label: 'Khác',                color: '#6B7280' },
};

export const LOAI_HOAT_DONG_OPTIONS = Object.values(LOAI_HOAT_DONG);

// Cấp độ — PHẢI khớp với CapDoEnum.java ở backend
export const CAP_DO = {
  DOAN_TRUONG:        { value: 'DOAN_TRUONG',        label: 'Đoàn trường',          color: '#3B82F6' },
  HOI_SINH_VIEN:      { value: 'HOI_SINH_VIEN',      label: 'Hội sinh viên',        color: '#10B981' },
  TRUONG:             { value: 'TRUONG',             label: 'Trường',               color: '#F59E0B' },
  PHONG:              { value: 'PHONG',              label: 'Phòng',                color: '#8B5CF6' },
  KHOA:               { value: 'KHOA',               label: 'Khoa',                 color: '#EF4444' },
  CHI_DOAN:           { value: 'CHI_DOAN',           label: 'Chi đoàn',             color: '#6366F1' },
  TINH_DOAN:          { value: 'TINH_DOAN',          label: 'Tỉnh đoàn',            color: '#EC4899' },
  HOAT_DONG_PHOI_HOP: { value: 'HOAT_DONG_PHOI_HOP', label: 'Hoạt động phối hợp',  color: '#6B7280' },
};

export const CAP_DO_OPTIONS = Object.values(CAP_DO);

// Trạng thái hoạt động
export const TRANG_THAI_HOAT_DONG = {
  SAP_DIEN_RA: { value: 'SAP_DIEN_RA', label: 'Sắp diễn ra', color: '#3B82F6', badge: 'info' },
  DANG_MO_DANG_KY: { value: 'DANG_MO_DANG_KY', label: 'Đang mở đăng ký', color: '#10B981', badge: 'success' },
  DANG_DIEN_RA: { value: 'DANG_DIEN_RA', label: 'Đang diễn ra', color: '#F59E0B', badge: 'warning' },
  DA_KET_THUC: { value: 'DA_KET_THUC', label: 'Đã kết thúc', color: '#9CA3AF', badge: 'secondary' },
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

// Học kỳ
export const HOC_KY_OPTIONS = [
  { value: 1, label: 'Học kỳ 1 (Tháng 8 – 11)' },
  { value: 2, label: 'Học kỳ 2 (Tháng 12 – 3)' },
  { value: 3, label: 'Học kỳ 3 (Tháng 3 – 6)' },
];

export const getHocKyLabel = (soHocKy) => {
  const found = HOC_KY_OPTIONS.find((o) => o.value === soHocKy);
  return found ? found.label : `Học kỳ ${soHocKy}`;
};

// Time constants
export const DEFAULT_CHECK_IN_EARLY = 30; // phút
export const DEFAULT_MAX_LATE_TIME = 15; // phút
export const DEFAULT_MIN_PARTICIPATION_TIME = 120; // phút
