    -- ============================================================
    -- V34: Phân quyền đa cấp — 6 vai trò + role_default_permissions
    --
    -- Thay đổi:
    --   1. Thêm cột ma_lop vào taikhoan (scope chi đoàn)
    --   2. Tạo bảng role_default_permissions (quyền mặc định theo role)
    --   3. Migrate dữ liệu: la_admin=TRUE → ADMIN, SINH_VIEN → DOAN_VIEN
    --   4. Insert bộ quyền mặc định cho từng role
    -- ============================================================

    -- ── 1. Thêm cột ma_lop vào taikhoan ─────────────────────────────────────────
    ALTER TABLE `taikhoan`
        ADD COLUMN IF NOT EXISTS `ma_lop` VARCHAR(20) NULL
            COMMENT 'Scope chi đoàn cho QUAN_LY_CHI_DOAN / PHO_CHI_DOAN';

    -- MariaDB không hỗ trợ IF NOT EXISTS cho ADD CONSTRAINT
    -- Migration chỉ chạy 1 lần qua Flyway nên không cần guard
    ALTER TABLE `taikhoan`
        ADD CONSTRAINT `fk_taikhoan_lop`
            FOREIGN KEY (`ma_lop`) REFERENCES `lop`(`ma_lop`);

    -- ── 2. Tạo bảng role_default_permissions ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS `role_default_permissions` (
        `id`            BIGINT PRIMARY KEY AUTO_INCREMENT,
        `vai_tro`       VARCHAR(50)  NOT NULL COMMENT 'VaiTroEnum.name()',
        `permission_id` BIGINT       NOT NULL,
        `created_at`    DATETIME(6)  DEFAULT NOW(6),
        UNIQUE KEY `uq_role_perm` (`vai_tro`, `permission_id`),
        CONSTRAINT `fk_rdp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- ── 3. Migrate vai trò cũ ────────────────────────────────────────────────────
    -- la_admin=TRUE + QUAN_LY → ADMIN
    UPDATE `taikhoan`
    SET `vai_tro` = 'ADMIN'
    WHERE `vai_tro` = 'QUAN_LY' AND `la_admin` = TRUE;

    -- QUAN_LY thường → QUAN_LY_KHOA (cán bộ đoàn cấp khoa)
    UPDATE `taikhoan`
    SET `vai_tro` = 'QUAN_LY_KHOA'
    WHERE `vai_tro` = 'QUAN_LY' AND `la_admin` = FALSE;

    -- SINH_VIEN → DOAN_VIEN
    UPDATE `taikhoan`
    SET `vai_tro` = 'DOAN_VIEN'
    WHERE `vai_tro` = 'SINH_VIEN';

    -- ── 4. Insert quyền mặc định — QUAN_LY_KHOA (Bí thư Đoàn khoa) ─────────────
    INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
    SELECT 'QUAN_LY_KHOA', `id` FROM `permissions` WHERE `name` IN (
        -- Hệ thống cá nhân
        'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
        -- Sinh viên
        'XEM_SINH_VIEN', 'THEM_SINH_VIEN', 'SUA_SINH_VIEN', 'XOA_SINH_VIEN', 'IMPORT_SINH_VIEN', 'EXPORT_SINH_VIEN',
        -- Giảng viên
        'XEM_GIANG_VIEN',
        -- Chuyên viên
        'XEM_CHUYEN_VIEN',
        -- Tổ chức (chỉ xem)
        'XEM_KHOA', 'XEM_NGANH', 'XEM_LOP',
        -- Hoạt động
        'XEM_HOAT_DONG', 'TAO_HOAT_DONG', 'SUA_HOAT_DONG', 'XOA_HOAT_DONG',
        'DUYET_HOAT_DONG', 'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG',
        'XEM_LICH_SU_DANG_KY', 'QUAN_LY_DANG_KY',
        -- Điểm danh
        'QUET_QR', 'GIAO_DIEM_DANH', 'XEM_DIEM_DANH', 'CHINH_SUA_DIEM_DANH', 'XUAT_DS_DIEM_DANH', 'XUAT_DS_DANG_KY',
        -- BCH
        'XEM_BCH', 'THEM_BCH', 'SUA_BCH', 'XOA_BCH',
        'XEM_CHUC_VU', 'THEM_CHUC_VU', 'SUA_CHUC_VU', 'XOA_CHUC_VU',
        'XEM_BAN', 'THEM_BAN', 'SUA_BAN', 'XOA_BAN',
        -- Tài khoản
        'XEM_TAI_KHOAN', 'DUYET_TAI_KHOAN', 'TAO_TAI_KHOAN', 'SUA_TAI_KHOAN',
        -- Phân quyền
        'QUAN_LY_PHAN_QUYEN_TAI_KHOAN',
        -- Báo cáo
        'XEM_BAO_CAO', 'XUAT_BAO_CAO', 'XEM_THONG_KE',
        -- Tin tức
        'DANG_TIN_TUC', 'SUA_TIN_TUC', 'XOA_TIN_TUC', 'DUYET_TIN_TUC', 'QUAN_LY_CHUYEN_MUC'
    );

    -- ── 5. Insert quyền mặc định — PHO_QUAN_LY_KHOA (Phó bí thư Đoàn khoa) ─────
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

    -- ── 6. Insert quyền mặc định — QUAN_LY_CHI_DOAN (Bí thư chi đoàn) ──────────
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

    -- ── 7. Insert quyền mặc định — PHO_CHI_DOAN (UV chi đoàn) ───────────────────
    INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
    SELECT 'PHO_CHI_DOAN', `id` FROM `permissions` WHERE `name` IN (
        'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
        'XEM_SINH_VIEN',
        'XEM_HOAT_DONG', 'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG', 'XEM_LICH_SU_DANG_KY',
        'QUET_QR', 'XEM_DIEM_DANH'
    );

    -- ── 8. Insert quyền mặc định — DOAN_VIEN (Đoàn viên thường) ─────────────────
    INSERT IGNORE INTO `role_default_permissions` (`vai_tro`, `permission_id`)
    SELECT 'DOAN_VIEN', `id` FROM `permissions` WHERE `name` IN (
        'DOI_MAT_KHAU', 'XEM_THONG_TIN_CA_NHAN', 'SUA_THONG_TIN_CA_NHAN',
        'XEM_HOAT_DONG', 'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG', 'XEM_LICH_SU_DANG_KY',
        'QUET_QR'
    );
    -- ADMIN không cần insert — bypass toàn bộ trong CustomPermissionEvaluator.
