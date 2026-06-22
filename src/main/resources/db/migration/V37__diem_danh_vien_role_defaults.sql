-- V37: Vai trò DIEM_DANH_VIEN — Cộng tác viên điểm danh
-- Đây là tài khoản dành riêng cho đội điểm danh sự kiện,
-- chỉ có quyền điểm danh + xem thông tin cần thiết, không có quyền quản trị.

INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'DIEM_DANH_VIEN', `id` FROM `permissions` WHERE `name` IN (
    -- Cá nhân
    'DOI_MAT_KHAU',
    'XEM_THONG_TIN_CA_NHAN',
    'SUA_THONG_TIN_CA_NHAN',

    -- Điểm danh (core)
    'QUET_QR',
    'GIAO_DIEM_DANH',
    'XEM_DIEM_DANH',
    'XUAT_DS_DIEM_DANH',
    'XUAT_DS_DANG_KY',

    -- Xem thông tin hỗ trợ điểm danh
    'XEM_HOAT_DONG',
    'XEM_SINH_VIEN'
);
