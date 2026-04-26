-- ============================================================
-- V25: Cấu hình CLB & Đăng ký thành viên
-- ============================================================

-- ── 1. Bảng cấu hình riêng cho từng CLB ────────────────────
CREATE TABLE IF NOT EXISTS `clb_cau_hinh` (
    `ma_clb`                 VARCHAR(20)   NOT NULL,
    -- Cơ chế xét duyệt thành viên
    `co_che_thanh_vien`      VARCHAR(30)   NOT NULL DEFAULT 'TU_DO'
                             COMMENT 'TU_DO | YEU_CAU_HOAT_DONG | YEU_CAU_DONG_PHI | YEU_CAU_CA_HAI',
    `so_hoat_dong_toi_thieu` INT           DEFAULT NULL
                             COMMENT 'Số hoạt động tối thiểu/kỳ (dùng khi cơ chế yêu cầu HĐ)',
    `so_tien_phi_ky`         DECIMAL(12,0) DEFAULT 50000
                             COMMENT 'Mức phí mặc định/kỳ (dùng khi cơ chế yêu cầu phí)',
    `don_vi_phi`             VARCHAR(10)   DEFAULT 'KY'
                             COMMENT 'Đơn vị chu kỳ phí: KY | NAM | THANG',
    -- Cho phép sinh viên tự đăng ký
    `cho_phep_dang_ky_tu_do` BOOLEAN       NOT NULL DEFAULT TRUE,
    `can_duyet_dang_ky`      BOOLEAN       NOT NULL DEFAULT TRUE
                             COMMENT 'TRUE = phải được BCN duyệt; FALSE = tự động vào',
    `so_thanh_vien_toi_da`   INT           DEFAULT NULL
                             COMMENT 'Giới hạn thành viên (NULL = không giới hạn)',
    -- Thông tin tài khoản ngân hàng (chuyển từ clb_payment_config)
    `bank_account_no`        VARCHAR(30)   DEFAULT NULL,
    `bank_name`              VARCHAR(50)   DEFAULT NULL,
    `account_name`           VARCHAR(200)  DEFAULT NULL,
    `ma_xac_thuc_ck`         VARCHAR(100)  DEFAULT NULL
                             COMMENT 'Prefix nội dung CK, VD: PHICLB CLB001',
    `webhook_secret`         VARCHAR(200)  DEFAULT NULL,
    `webhook_provider`       VARCHAR(20)   DEFAULT 'CASSO'
                             COMMENT 'CASSO | SEPAY',
    -- Mô tả yêu cầu hiển thị cho sinh viên khi đăng ký
    `mo_ta_yeu_cau`          TEXT          DEFAULT NULL,
    -- Audit
    `created_at`             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`             VARCHAR(100),
    PRIMARY KEY (`ma_clb`),
    CONSTRAINT `fk_cauhinh_clb` FOREIGN KEY (`ma_clb`) REFERENCES `cau_lac_bo` (`ma_clb`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cấu hình riêng theo từng CLB/Đội/Nhóm';

-- ── 2. Bảng đơn đăng ký thành viên (self-registration) ─────
CREATE TABLE IF NOT EXISTS `dang_ky_thanh_vien_clb` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT,
    `ma_clb`       VARCHAR(20)  NOT NULL,
    `ma_sv`        VARCHAR(50)  NOT NULL,
    `trang_thai`   VARCHAR(20)  NOT NULL DEFAULT 'CHO_DUYET'
                   COMMENT 'CHO_DUYET | DA_DUYET | TU_CHOI | HUY',
    `ly_do_dang_ky` TEXT        COMMENT 'Lý do / giới thiệu bản thân của SV',
    `ly_do_xu_ly`  VARCHAR(500) DEFAULT NULL
                   COMMENT 'Lý do duyệt/từ chối từ BCN',
    `nguoi_xu_ly`  VARCHAR(100) DEFAULT NULL
                   COMMENT 'Username người duyệt/từ chối',
    `ngay_xu_ly`   DATETIME     DEFAULT NULL,
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    -- Không unique tuyệt đối để cho phép tái đăng ký sau khi bị từ chối
    INDEX `idx_dangky_clb_sv`    (`ma_clb`, `ma_sv`),
    INDEX `idx_dangky_clb`       (`ma_clb`),
    INDEX `idx_dangky_sv`        (`ma_sv`),
    INDEX `idx_dangky_trang_thai`(`trang_thai`),
    CONSTRAINT `fk_dangky_clb`   FOREIGN KEY (`ma_clb`) REFERENCES `cau_lac_bo`(`ma_clb`),
    CONSTRAINT `fk_dangky_sv`    FOREIGN KEY (`ma_sv`)  REFERENCES `sinhvien`  (`ma_sv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đơn đăng ký tham gia CLB của sinh viên – pending phê duyệt';

-- ── 3. Permissions ──────────────────────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
('CLB', 'DUYET_THANH_VIEN_CLB',  'Duyệt / từ chối đơn đăng ký thành viên CLB'),
('CLB', 'CAU_HINH_CLB',          'Cấu hình tham số CLB (cơ chế, phí, đăng ký)'),
('CLB', 'DANG_KY_CLB',           'Sinh viên tự đăng ký tham gia CLB');

INSERT IGNORE INTO `role_permissions` (`role_name`, `permission_id`)
SELECT r.role_name, p.id
FROM (
  SELECT 'ADMIN'       AS role_name UNION ALL
  SELECT 'BCH_LEVEL_1' UNION ALL
  SELECT 'BCH_LEVEL_2'
) r
JOIN `permissions` p ON p.name IN ('DUYET_THANH_VIEN_CLB', 'CAU_HINH_CLB');

-- DANG_KY_CLB cấp cho sinh viên
INSERT IGNORE INTO `role_permissions` (`role_name`, `permission_id`)
SELECT 'SINH_VIEN', p.id
FROM `permissions` p WHERE p.name = 'DANG_KY_CLB';
