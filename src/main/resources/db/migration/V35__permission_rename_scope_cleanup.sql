-- ============================================================
-- V35: Đổi tên permission TO_CHUC để tránh trùng với tên vai trò
--
-- Vấn đề: 'QUAN_LY_KHOA' permission (id 17) trùng tên với
--         VaiTroEnum.QUAN_LY_KHOA → gây nhầm lẫn trong ma trận quyền.
--
-- Giải pháp: Đổi prefix QUAN_LY_ → CAI_DAT_ cho 7 permission quản lý
--            cấu hình hệ thống (chỉ ADMIN mới dùng).
--
-- Tất cả UPDATE dùng WHERE name = '...' để an toàn idempotent.
-- ============================================================

-- ── 1. Đổi tên permission TO_CHUC (cấp hệ thống) ─────────────────────────────
UPDATE `permissions` SET `name` = 'CAI_DAT_KHOA',     `description` = 'Thêm/sửa/xóa Khoa'
WHERE `name` = 'QUAN_LY_KHOA'     AND `category` = 'TO_CHUC';

UPDATE `permissions` SET `name` = 'CAI_DAT_NGANH',    `description` = 'Thêm/sửa/xóa Ngành'
WHERE `name` = 'QUAN_LY_NGANH'    AND `category` = 'TO_CHUC';

UPDATE `permissions` SET `name` = 'CAI_DAT_LOP',      `description` = 'Thêm/sửa/xóa Lớp'
WHERE `name` = 'QUAN_LY_LOP'      AND `category` = 'TO_CHUC';

UPDATE `permissions` SET `name` = 'CAI_DAT_KHOA_HOC', `description` = 'Thêm/sửa/xóa Khóa học'
WHERE `name` = 'QUAN_LY_KHOA_HOC' AND `category` = 'TO_CHUC';

UPDATE `permissions` SET `name` = 'CAI_DAT_HOC_KY',   `description` = 'Thêm/sửa/xóa Học kỳ'
WHERE `name` = 'QUAN_LY_HOC_KY'   AND `category` = 'TO_CHUC';

UPDATE `permissions` SET `name` = 'CAI_DAT_NAM_HOC',  `description` = 'Thêm/sửa/xóa Năm học'
WHERE `name` = 'QUAN_LY_NAM_HOC'  AND `category` = 'TO_CHUC';

-- ── 2. Đổi tên QUAN_LY_CHUYEN_VIEN → CAI_DAT_CHUYEN_VIEN ────────────────────
-- (V19 đã thêm THEM/SUA/XOA_CHUYEN_VIEN riêng, cái này chỉ dùng cho ADMIN)
UPDATE `permissions` SET `name` = 'CAI_DAT_CHUYEN_VIEN', `description` = 'Quản lý toàn bộ danh sách chuyên viên'
WHERE `name` = 'QUAN_LY_CHUYEN_VIEN';

-- ── 3. Bổ sung quyền V19 granular vào role_default_permissions ────────────────
-- QUAN_LY_KHOA: bổ sung XEM/THEM/SUA/XOA chức vụ và ban
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'QUAN_LY_KHOA', `id` FROM `permissions` WHERE `name` IN (
    'XEM_CHUC_VU', 'THEM_CHUC_VU', 'SUA_CHUC_VU', 'XOA_CHUC_VU',
    'XEM_BAN',     'THEM_BAN',     'SUA_BAN',     'XOA_BAN',
    'EXPORT_SINH_VIEN',
    'GIAO_DIEM_DANH',
    'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY',
    'XUAT_BAO_CAO',
    'QUAN_LY_PHAN_QUYEN_NHOM',
    'IMPORT_SINH_VIEN'
);

-- PHO_QUAN_LY_KHOA: bổ sung
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'PHO_QUAN_LY_KHOA', `id` FROM `permissions` WHERE `name` IN (
    'XEM_CHUC_VU', 'THEM_CHUC_VU', 'SUA_CHUC_VU',
    'XEM_BAN',     'THEM_BAN',     'SUA_BAN',
    'EXPORT_SINH_VIEN',
    'GIAO_DIEM_DANH',
    'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY',
    'XUAT_BAO_CAO'
);

-- QUAN_LY_CHI_DOAN: bổ sung
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'QUAN_LY_CHI_DOAN', `id` FROM `permissions` WHERE `name` IN (
    'XEM_CHUC_VU', 'XEM_BAN',
    'GIAO_DIEM_DANH',
    'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY'
);

-- PHO_CHI_DOAN: bổ sung
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'PHO_CHI_DOAN', `id` FROM `permissions` WHERE `name` IN (
    'XEM_CHUC_VU', 'XEM_BAN',
    'GIAO_DIEM_DANH',
    'XUAT_DS_DIEM_DANH'
);

-- ── 4. Dọn tai_khoan_quyen: xóa tham chiếu đến permission đã đổi tên ─────────
-- (Không cần — ta chỉ đổi tên chứ không xóa permission, FK vẫn còn hợp lệ)

-- ── 5. Xác nhận kết quả ────────────────────────────────────────────────────────
-- SELECT id, category, name, description FROM permissions
-- WHERE category IN ('TO_CHUC', 'CHUYEN_VIEN')
-- ORDER BY category, name;
