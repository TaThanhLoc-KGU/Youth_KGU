-- ============================================================
-- V20: Quản lý Câu lạc bộ / Đội / Nhóm (CLB)
-- Chạy thủ công trên server sau khi deploy backend mới.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. BẢNG câu lạc bộ / đội / nhóm
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `cau_lac_bo` (
    `ma_clb`            VARCHAR(20)  NOT NULL COMMENT 'Mã CLB (e.g. CLB001)',
    `ten_clb`           VARCHAR(200) NOT NULL COMMENT 'Tên câu lạc bộ / đội / nhóm',
    `loai`              VARCHAR(20)  NOT NULL DEFAULT 'CLB' COMMENT 'CLB | DOI | NHOM',
    `mo_ta`             TEXT         COMMENT 'Mô tả hoạt động',
    `linh_vuc`          VARCHAR(100) COMMENT 'Lĩnh vực (Văn nghệ, Thể thao, Học thuật...)',
    `ma_khoa`           VARCHAR(10)  COMMENT 'NULL = Đoàn trường / Hội SV cấp trường',
    `ma_ban`            VARCHAR(20)  COMMENT 'Ban/Đội quản lý CLB này',
    `truong_clb_ma_sv`  VARCHAR(50)  COMMENT 'MSSV trưởng CLB',
    `ngay_thanh_lap`    DATE         COMMENT 'Ngày thành lập',
    `is_active`         BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_clb`),
    INDEX `idx_clb_loai`      (`loai`),
    INDEX `idx_clb_khoa`      (`ma_khoa`),
    INDEX `idx_clb_is_active` (`is_active`),
    CONSTRAINT `fk_clb_khoa` FOREIGN KEY (`ma_khoa`)           REFERENCES `khoa`      (`ma_khoa`),
    CONSTRAINT `fk_clb_ban`  FOREIGN KEY (`ma_ban`)            REFERENCES `ban`       (`ma_ban`),
    CONSTRAINT `fk_clb_sv`   FOREIGN KEY (`truong_clb_ma_sv`)  REFERENCES `sinhvien`  (`ma_sv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Câu lạc bộ / Đội / Nhóm trực thuộc Đoàn - Hội';

-- ══════════════════════════════════════════════════════════════
-- 2. BẢNG thành viên CLB theo học kỳ
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `thanh_vien_clb` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `ma_clb`        VARCHAR(20)  NOT NULL,
    `ma_sv`         VARCHAR(50)  NOT NULL,
    `ma_hoc_ky`     VARCHAR(20)  COMMENT 'Học kỳ tham gia (NULL = tất cả kỳ)',
    `chuc_vu`       VARCHAR(30)  NOT NULL DEFAULT 'THANH_VIEN'
                    COMMENT 'CHU_NHIEM | PHO_CHU_NHIEM | THANH_VIEN | CO_VAN | BAN_QUAN_LY',
    `ngay_tham_gia` DATE         COMMENT 'Ngày gia nhập CLB',
    `ngay_roi_clb`  DATE         COMMENT 'Ngày rời CLB (NULL = còn sinh hoạt)',
    `ghi_chu`       VARCHAR(500),
    `is_active`     BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_tv_clb_sv_hk` (`ma_clb`, `ma_sv`, `ma_hoc_ky`),
    INDEX `idx_tviclb_sv`  (`ma_sv`),
    INDEX `idx_tviclb_clb` (`ma_clb`),
    INDEX `idx_tviclb_hk`  (`ma_hoc_ky`),
    CONSTRAINT `fk_tviclb_clb` FOREIGN KEY (`ma_clb`)    REFERENCES `cau_lac_bo` (`ma_clb`),
    CONSTRAINT `fk_tviclb_sv`  FOREIGN KEY (`ma_sv`)     REFERENCES `sinhvien`   (`ma_sv`),
    CONSTRAINT `fk_tviclb_hk`  FOREIGN KEY (`ma_hoc_ky`) REFERENCES `hoc_ky`     (`ma_hoc_ky`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh sách thành viên CLB/Đội/Nhóm theo học kỳ';

-- ══════════════════════════════════════════════════════════════
-- 3. LIÊN KẾT hoạt động → CLB
-- ══════════════════════════════════════════════════════════════
ALTER TABLE `hoat_dong`
    ADD COLUMN IF NOT EXISTS `ma_clb` VARCHAR(20) DEFAULT NULL
        COMMENT 'CLB/Đội/Nhóm tổ chức (NULL = không thuộc CLB cụ thể)';

ALTER TABLE `hoat_dong`
    ADD INDEX IF NOT EXISTS `idx_hd_clb` (`ma_clb`);

-- Không thêm FK để tránh ràng buộc khi xóa CLB; quản lý ở application layer.

-- ══════════════════════════════════════════════════════════════
-- 4. PERMISSIONS cho CLB
-- ══════════════════════════════════════════════════════════════
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
('CLB', 'XEM_CLB',                'Xem danh sách câu lạc bộ / đội / nhóm'),
('CLB', 'QUAN_LY_CLB',            'Tạo, sửa, xóa câu lạc bộ / đội / nhóm'),
('CLB', 'QUAN_LY_THANH_VIEN_CLB', 'Thêm, sửa, xóa thành viên CLB');

-- ══════════════════════════════════════════════════════════════
-- 5. PHÂN QUYỀN theo vai trò
-- ══════════════════════════════════════════════════════════════
-- Admin & BCH cấp cao: toàn quyền CLB
INSERT IGNORE INTO `role_permissions` (`role_name`, `permission_id`)
SELECT r.role_name, p.id
FROM (SELECT 'ADMIN'       AS role_name UNION ALL
      SELECT 'BCH_LEVEL_1'              UNION ALL
      SELECT 'BCH_LEVEL_2') r
JOIN `permissions` p ON p.name IN ('XEM_CLB','QUAN_LY_CLB','QUAN_LY_THANH_VIEN_CLB');

-- BCH cấp 3 (cán bộ khoa): xem + quản lý CLB, không quản lý thành viên riêng lẻ
INSERT IGNORE INTO `role_permissions` (`role_name`, `permission_id`)
SELECT 'BCH_LEVEL_3', p.id FROM `permissions` p
WHERE p.name IN ('XEM_CLB','QUAN_LY_CLB','QUAN_LY_THANH_VIEN_CLB');

-- Sinh viên: chỉ xem
INSERT IGNORE INTO `role_permissions` (`role_name`, `permission_id`)
SELECT 'SINH_VIEN', p.id FROM `permissions` p WHERE p.name = 'XEM_CLB';

-- ══════════════════════════════════════════════════════════════
-- 6. CẬP NHẬT CapDoEnum — thêm CLB vào danh sách cấp độ
-- (Java enum đã được cập nhật, bảng không cần thay đổi cấu trúc)
-- Chỉ cần đảm bảo cột cap_do có đủ độ dài cho giá trị 'CLB'
-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE hoat_dong MODIFY cap_do VARCHAR(50) NOT NULL; -- nếu cần mở rộng
