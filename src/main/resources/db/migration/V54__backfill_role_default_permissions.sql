-- ============================================================
-- V54: Backfill dữ liệu phân quyền (role_default_permissions) bị thiếu trên production
--
-- Nguyên nhân: spring.flyway.enabled=false (tắt do trùng version V17/V29) +
-- ddl-auto=update → Hibernate chỉ tự tạo CẤU TRÚC bảng, không bao giờ chạy các
-- câu INSERT/UPDATE dữ liệu trong V34, V35, V36, V37, V38. Kết quả: bảng
-- role_default_permissions gần như trống trên production → mọi tài khoản không
-- phải ADMIN có 0 quyền hiệu lực → mọi @PreAuthorize("hasPermission(...)") đều
-- trả 403 ("Bạn không có quyền ...") cho sinh viên/BCH.
--
-- File này gộp lại toàn bộ phần DATA (không đụng schema — schema đã có sẵn nhờ
-- ddl-auto=update) của V34, V35, V36, V37, V38. Mọi câu lệnh đều idempotent
-- (INSERT IGNORE / UPDATE ... WHERE ...) nên chạy lại nhiều lần vẫn an toàn.
--
-- Cách chạy thủ công 1 lần trên production (Flyway đang tắt):
--   mysql -u youthkgu -p youth-kgu < V54__backfill_role_default_permissions.sql
-- ============================================================

-- ── 1. Chuẩn hoá giá trị vai_tro cũ trong bảng taikhoan (V34 §3) ─────────────
-- (App đã tự map qua VaiTroEnumConverter.fromValue() khi đọc, phần này chỉ để
--  dữ liệu thô trong DB nhất quán với enum hiện tại — an toàn, tuỳ chọn.)
UPDATE `taikhoan`
SET `vai_tro` = 'ADMIN'
WHERE `vai_tro` = 'QUAN_LY' AND `la_admin` = TRUE;

UPDATE `taikhoan`
SET `vai_tro` = 'QUAN_LY_KHOA'
WHERE `vai_tro` = 'QUAN_LY' AND `la_admin` = FALSE;

UPDATE `taikhoan`
SET `vai_tro` = 'DOAN_VIEN'
WHERE `vai_tro` = 'SINH_VIEN';

-- ── 2. Quyền mặc định — QUAN_LY_KHOA (V34 §4) ────────────────────────────────
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'QUAN_LY_KHOA', `id` FROM `permissions` WHERE `name` IN (
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    'XEM_SINH_VIEN', 'THEM_SINH_VIEN', 'SUA_SINH_VIEN', 'XOA_SINH_VIEN', 'IMPORT_SINH_VIEN', 'EXPORT_SINH_VIEN',
    'XEM_GIANG_VIEN',
    'XEM_CHUYEN_VIEN',
    'XEM_KHOA', 'XEM_NGANH', 'XEM_LOP',
    'XEM_HOAT_DONG', 'TAO_HOAT_DONG', 'SUA_HOAT_DONG', 'XOA_HOAT_DONG',
    'DUYET_HOAT_DONG', 'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG',
    'XEM_LICH_SU_DANG_KY', 'QUAN_LY_DANG_KY',
    'QUET_QR', 'GIAO_DIEM_DANH', 'XEM_DIEM_DANH', 'CHINH_SUA_DIEM_DANH', 'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY',
    'XEM_BCH', 'THEM_BCH', 'SUA_BCH', 'XOA_BCH',
    'XEM_CHUC_VU', 'THEM_CHUC_VU', 'SUA_CHUC_VU', 'XOA_CHUC_VU',
    'XEM_BAN', 'THEM_BAN', 'SUA_BAN', 'XOA_BAN',
    'XEM_TAI_KHOAN', 'DUYET_TAI_KHOAN', 'TAO_TAI_KHOAN', 'SUA_TAI_KHOAN',
    'QUAN_LY_PHAN_QUYEN_TAI_KHOAN',
    'XEM_BAO_CAO', 'XUAT_BAO_CAO', 'XEM_THONG_KE',
    'DANG_TIN_TUC', 'SUA_TIN_TUC', 'XOA_TIN_TUC', 'DUYET_TIN_TUC', 'QUAN_LY_CHUYEN_MUC'
);

-- ── 3. Quyền mặc định — PHO_QUAN_LY_KHOA (V34 §5) ────────────────────────────
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'PHO_QUAN_LY_KHOA', `id` FROM `permissions` WHERE `name` IN (
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    'XEM_SINH_VIEN', 'SUA_SINH_VIEN', 'EXPORT_SINH_VIEN',
    'XEM_GIANG_VIEN',
    'XEM_KHOA', 'XEM_NGANH', 'XEM_LOP',
    'XEM_HOAT_DONG', 'TAO_HOAT_DONG', 'SUA_HOAT_DONG',
    'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG', 'XEM_LICH_SU_DANG_KY', 'QUAN_LY_DANG_KY',
    'QUET_QR', 'GIAO_DIEM_DANH', 'XEM_DIEM_DANH', 'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY',
    'XEM_BCH', 'XEM_CHUC_VU', 'XEM_BAN',
    'XEM_TAI_KHOAN',
    'XEM_BAO_CAO', 'XEM_THONG_KE',
    'DANG_TIN_TUC', 'SUA_TIN_TUC'
);

-- ── 4. Quyền mặc định — QUAN_LY_CHI_DOAN (V34 §6) ────────────────────────────
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'QUAN_LY_CHI_DOAN', `id` FROM `permissions` WHERE `name` IN (
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    'XEM_SINH_VIEN', 'SUA_SINH_VIEN',
    'XEM_LOP',
    'XEM_HOAT_DONG', 'TAO_HOAT_DONG', 'SUA_HOAT_DONG',
    'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG', 'XEM_LICH_SU_DANG_KY', 'QUAN_LY_DANG_KY',
    'QUET_QR', 'GIAO_DIEM_DANH', 'XEM_DIEM_DANH', 'CHINH_SUA_DIEM_DANH', 'XUAT_DS_DIEM_DANH',
    'XEM_BCH', 'XEM_CHUC_VU', 'XEM_BAN',
    'XEM_BAO_CAO'
);

-- ── 5. Quyền mặc định — PHO_CHI_DOAN (V34 §7) ────────────────────────────────
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'PHO_CHI_DOAN', `id` FROM `permissions` WHERE `name` IN (
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    'XEM_SINH_VIEN',
    'XEM_HOAT_DONG', 'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG', 'XEM_LICH_SU_DANG_KY',
    'QUET_QR', 'XEM_DIEM_DANH'
);

-- ── 6. Quyền mặc định — DOAN_VIEN / sinh viên thường (V34 §8) ────────────────
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'DOAN_VIEN', `id` FROM `permissions` WHERE `name` IN (
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    'XEM_HOAT_DONG', 'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG', 'XEM_LICH_SU_DANG_KY',
    'QUET_QR'
);
-- ADMIN không cần insert — CustomPermissionEvaluator bypass toàn bộ quyền cho ADMIN.

-- ── 7. Đổi tên permission cấp hệ thống để tránh trùng tên vai trò (V35 §1-2) ──
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

UPDATE `permissions` SET `name` = 'CAI_DAT_CHUYEN_VIEN', `description` = 'Quản lý toàn bộ danh sách chuyên viên'
WHERE `name` = 'QUAN_LY_CHUYEN_VIEN';

-- ── 8. Bổ sung quyền granular V19 vào role_default_permissions (V35 §3) ─────
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

INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'PHO_QUAN_LY_KHOA', `id` FROM `permissions` WHERE `name` IN (
    'XEM_CHUC_VU', 'THEM_CHUC_VU', 'SUA_CHUC_VU',
    'XEM_BAN',     'THEM_BAN',     'SUA_BAN',
    'EXPORT_SINH_VIEN',
    'GIAO_DIEM_DANH',
    'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY',
    'XUAT_BAO_CAO'
);

INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'QUAN_LY_CHI_DOAN', `id` FROM `permissions` WHERE `name` IN (
    'XEM_CHUC_VU', 'XEM_BAN',
    'GIAO_DIEM_DANH',
    'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY'
);

INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'PHO_CHI_DOAN', `id` FROM `permissions` WHERE `name` IN (
    'XEM_CHUC_VU', 'XEM_BAN',
    'GIAO_DIEM_DANH',
    'XUAT_DS_DIEM_DANH'
);

-- ── 9. Gom quyền điểm danh vào 1 category cho dễ nhìn trong Permission Matrix (V36) ──
UPDATE `permissions`
SET `category` = 'DIEM_DANH'
WHERE `name` IN (
    'QUET_QR', 'GIAO_DIEM_DANH', 'XEM_DIEM_DANH', 'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY'
);

-- ── 10. Quyền mặc định — DIEM_DANH_VIEN / cộng tác viên điểm danh (V37) ──────
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'DIEM_DANH_VIEN', `id` FROM `permissions` WHERE `name` IN (
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    'QUET_QR', 'GIAO_DIEM_DANH', 'XEM_DIEM_DANH', 'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY',
    'XEM_HOAT_DONG', 'XEM_SINH_VIEN'
);

-- ── 11. Quyền mặc định — QUAN_LY_CLB / chủ nhiệm CLB-Đội-Nhóm (V38) ──────────
INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
SELECT 'QUAN_LY_CLB', `id` FROM `permissions` WHERE `name` IN (
    'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
    'XEM_CLB', 'QUAN_LY_CLB', 'QUAN_LY_THANH_VIEN_CLB',
    'DUYET_THANH_VIEN_CLB', 'CAU_HINH_CLB', 'QUAN_LY_BCN_CLB',
    'XEM_HOAT_DONG', 'THEM_HOAT_DONG', 'SUA_HOAT_DONG', 'DUYET_HOAT_DONG_CLB',
    'QUET_QR', 'GIAO_DIEM_DANH', 'XEM_DIEM_DANH',
    'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY',
    'XEM_SINH_VIEN', 'EXPORT_SINH_VIEN'
);

-- ── 12. Kiểm tra kết quả sau khi chạy ─────────────────────────────────────────
-- SELECT vai_tro, COUNT(*) AS so_quyen FROM role_default_permissions GROUP BY vai_tro ORDER BY vai_tro;
-- Kỳ vọng: ADMIN không có dòng nào (bypass); DOAN_VIEN ~7 quyền; các role còn lại vài chục quyền.
