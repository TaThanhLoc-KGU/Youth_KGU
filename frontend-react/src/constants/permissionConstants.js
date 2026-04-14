// src/constants/permissionConstants.js
// Các giá trị nhomVaiTro khớp với VaiTroEnum.getNhomVaiTro() phía backend:
//   ADMIN       → QUAN_LY
//   BCH         → QUAN_LY
//   MANAGER     → QUAN_LY
//   GIANG_VIEN  → PHU_VU
//   STAFF       → PHU_VU
//   CHUYEN_VIEN → PHUC_VU
//   SINH_VIEN   → THAM_GIA

export const NHOM_VAI_TRO_LABELS = {
  QUAN_LY:  'Quản lý',
  PHU_VU:   'Phục vụ',
  PHUC_VU:  'Phục vụ',
  THAM_GIA: 'Thành viên',
};

export const NHOM_VAI_TRO_COLORS = {
  QUAN_LY:  'bg-red-100 text-red-700',
  PHU_VU:   'bg-blue-100 text-blue-700',
  PHUC_VU:  'bg-blue-100 text-blue-700',
  THAM_GIA: 'bg-gray-100 text-gray-700',
};