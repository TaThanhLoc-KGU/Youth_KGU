-- V38: Thêm quyền mặc định cho vai trò QUAN_LY_CLB (Chủ nhiệm CLB/Đội/Nhóm)
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'QUAN_LY_CLB', `id` FROM `permissions` WHERE `name` IN (
    -- Cá nhân
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    -- CLB
    'XEM_CLB', 'QUAN_LY_CLB', 'QUAN_LY_THANH_VIEN_CLB',
    'DUYET_THANH_VIEN_CLB', 'CAU_HINH_CLB', 'QUAN_LY_BCN_CLB',
    -- Hoạt động CLB
    'XEM_HOAT_DONG', 'THEM_HOAT_DONG', 'SUA_HOAT_DONG', 'DUYET_HOAT_DONG_CLB',
    -- Điểm danh
    'QUET_QR', 'GIAO_DIEM_DANH', 'XEM_DIEM_DANH',
    'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY',
    -- Sinh viên (xem)
    'XEM_SINH_VIEN', 'EXPORT_SINH_VIEN'
);
