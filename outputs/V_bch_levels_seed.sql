-- =============================================================
-- V_bch_levels_seed.sql
-- Seed permissions cho BCH Level 1 / 2 / 3 / 4
-- Chạy SAU V_permissions_cleanup.sql (cần bảng permissions đã có dữ liệu)
--
-- Mapping level:
--   BCH_LEVEL_1: Bí thư Đoàn trường, Chủ tịch HSV       → gần như full
--   BCH_LEVEL_2: Phó Bí thư Đoàn trường, Phó Chủ tịch   → full nghiệp vụ (trừ phân quyền hệ thống)
--   BCH_LEVEL_3: Ủy viên BCH, Ủy viên Ban thư ký Hội    → quản lý hoạt động + điểm danh
--   BCH_LEVEL_4: Quyền đặc biệt                          → tối thiểu (ví dụ: tài khoản chỉ quét QR)
-- =============================================================

START TRANSACTION;

-- Xóa data cũ của 4 levels (nếu có)
DELETE FROM role_permissions WHERE role_name IN ('BCH_LEVEL_1', 'BCH_LEVEL_2', 'BCH_LEVEL_3', 'BCH_LEVEL_4');

-- ─── BCH LEVEL 1: Bí thư Đoàn trường + Chủ tịch HSV ─────────────────────────
-- Gần như toàn bộ quyền nghiệp vụ (trừ xóa tài khoản, system logs, cài đặt hệ thống)
-- Level cao nhất — có quyền phân quyền cho cả hệ thống
INSERT INTO role_permissions (role_name, permission_id)
SELECT 'BCH_LEVEL_1', id FROM permissions
WHERE name IN (
    -- HE_THONG
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    -- SINH_VIEN
    'XEM_SINH_VIEN', 'THEM_SINH_VIEN', 'SUA_SINH_VIEN', 'XOA_SINH_VIEN', 'IMPORT_SINH_VIEN',
    -- GIANG_VIEN
    'XEM_GIANG_VIEN', 'THEM_GIANG_VIEN', 'SUA_GIANG_VIEN', 'XOA_GIANG_VIEN',
    -- CHUYEN_VIEN
    'XEM_CHUYEN_VIEN', 'QUAN_LY_CHUYEN_VIEN',
    -- TO_CHUC
    'XEM_KHOA', 'QUAN_LY_KHOA',
    'XEM_NGANH', 'QUAN_LY_NGANH',
    'XEM_LOP', 'QUAN_LY_LOP',
    'XEM_KHOA_HOC', 'QUAN_LY_KHOA_HOC',
    'XEM_HOC_KY', 'QUAN_LY_HOC_KY',
    -- HOAT_DONG
    'XEM_HOAT_DONG', 'TAO_HOAT_DONG', 'SUA_HOAT_DONG', 'XOA_HOAT_DONG', 'DUYET_HOAT_DONG',
    'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG', 'QUAN_LY_DANG_KY', 'XEM_LICH_SU_THAM_GIA',
    -- DIEM_DANH
    'QUET_QR', 'PHAN_CONG_DIEM_DANH', 'XEM_DIEM_DANH', 'SUA_DIEM_DANH',
    -- BCH
    'XEM_BCH', 'THEM_BCH', 'SUA_BCH', 'XOA_BCH', 'QUAN_LY_CHUC_VU', 'QUAN_LY_BAN',
    -- TAI_KHOAN
    'XEM_TAI_KHOAN', 'DUYET_TAI_KHOAN', 'TAO_TAI_KHOAN', 'SUA_TAI_KHOAN',
    -- PHAN_QUYEN (Level 1 mới có)
    'QUAN_LY_PHAN_QUYEN_NHOM', 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN',
    -- BAO_CAO
    'XEM_BAO_CAO', 'XUAT_BAO_CAO', 'XEM_THONG_KE'
    -- Không có: XOA_TAI_KHOAN, XEM_SYSTEM_LOG, XUAT_SYSTEM_LOG, CAI_DAT_HE_THONG
);

-- ─── BCH LEVEL 2: Phó Bí thư Đoàn trường + Phó Chủ tịch HSV ────────────────
-- Full nghiệp vụ: quản lý hoạt động, điểm danh, sinh viên, BCH, báo cáo
-- Không có quyền phân quyền hệ thống (chỉ Level 1)
INSERT INTO role_permissions (role_name, permission_id)
SELECT 'BCH_LEVEL_2', id FROM permissions
WHERE name IN (
    -- HE_THONG
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    -- SINH_VIEN (xem + sửa, không xóa)
    'XEM_SINH_VIEN', 'THEM_SINH_VIEN', 'SUA_SINH_VIEN', 'IMPORT_SINH_VIEN',
    -- GIANG_VIEN (xem)
    'XEM_GIANG_VIEN',
    -- CHUYEN_VIEN (xem)
    'XEM_CHUYEN_VIEN',
    -- TO_CHUC (xem)
    'XEM_KHOA', 'XEM_NGANH', 'XEM_LOP', 'XEM_KHOA_HOC', 'XEM_HOC_KY',
    -- HOAT_DONG (full)
    'XEM_HOAT_DONG', 'TAO_HOAT_DONG', 'SUA_HOAT_DONG', 'XOA_HOAT_DONG', 'DUYET_HOAT_DONG',
    'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG', 'QUAN_LY_DANG_KY', 'XEM_LICH_SU_THAM_GIA',
    -- DIEM_DANH (full)
    'QUET_QR', 'PHAN_CONG_DIEM_DANH', 'XEM_DIEM_DANH', 'SUA_DIEM_DANH',
    -- BCH (xem + thêm + sửa, không xóa)
    'XEM_BCH', 'THEM_BCH', 'SUA_BCH',
    -- TAI_KHOAN (xem + duyệt)
    'XEM_TAI_KHOAN', 'DUYET_TAI_KHOAN',
    -- BAO_CAO (xem + xuất)
    'XEM_BAO_CAO', 'XUAT_BAO_CAO', 'XEM_THONG_KE'
    -- Không có: QUAN_LY_PHAN_QUYEN_*, XOA_SINH_VIEN, XOA_BCH
);

-- ─── BCH LEVEL 3: Ủy viên BCH + Ủy viên Ban thư ký Hội ──────────────────────
-- Quản lý hoạt động + điểm danh + xem danh sách sinh viên + báo cáo cơ bản
INSERT INTO role_permissions (role_name, permission_id)
SELECT 'BCH_LEVEL_3', id FROM permissions
WHERE name IN (
    -- HE_THONG
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    -- SINH_VIEN (chỉ xem)
    'XEM_SINH_VIEN',
    -- HOAT_DONG (full quản lý)
    'XEM_HOAT_DONG', 'TAO_HOAT_DONG', 'SUA_HOAT_DONG', 'XOA_HOAT_DONG',
    'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG', 'QUAN_LY_DANG_KY', 'XEM_LICH_SU_THAM_GIA',
    -- DIEM_DANH (full)
    'QUET_QR', 'PHAN_CONG_DIEM_DANH', 'XEM_DIEM_DANH', 'SUA_DIEM_DANH',
    -- BAO_CAO (xem)
    'XEM_BAO_CAO', 'XEM_THONG_KE'
);

-- ─── BCH LEVEL 4: Quyền đặc biệt ─────────────────────────────────────────────
-- Tối thiểu — dành cho tài khoản đặc biệt (ví dụ: chỉ quét QR tại sự kiện)
-- Bí thư (Level 1) có thể mở thêm quyền cho Level 4 tùy nhu cầu via PermissionMatrixPage
INSERT INTO role_permissions (role_name, permission_id)
SELECT 'BCH_LEVEL_4', id FROM permissions
WHERE name IN (
    -- HE_THONG (cơ bản)
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN',
    -- HOAT_DONG (chỉ xem)
    'XEM_HOAT_DONG',
    -- DIEM_DANH (quét QR + xem)
    'QUET_QR', 'XEM_DIEM_DANH'
);

COMMIT;

-- Kiểm tra kết quả
SELECT role_name, COUNT(*) as so_quyen
FROM role_permissions
WHERE role_name IN ('BCH_LEVEL_1', 'BCH_LEVEL_2', 'BCH_LEVEL_3', 'BCH_LEVEL_4')
GROUP BY role_name
ORDER BY role_name;
