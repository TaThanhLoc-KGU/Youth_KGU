-- ============================================================
-- V24: Đóng phí CLB / Đội / Nhóm
-- Hỗ trợ: thu thủ công, QR tĩnh, và tự động qua webhook ngân hàng
-- ============================================================

CREATE TABLE IF NOT EXISTS `dong_phi_clb` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT,
    `ma_clb`         VARCHAR(20)  NOT NULL,
    `ma_sv`          VARCHAR(50)  NOT NULL,
    `ma_hoc_ky`      VARCHAR(20)  COMMENT 'Học kỳ đóng phí (NULL = không theo kỳ)',
    `so_tien`        DECIMAL(12,0) NOT NULL DEFAULT 50000,
    `trang_thai`     VARCHAR(20)  NOT NULL DEFAULT 'CHUA_DONG'
                     COMMENT 'CHUA_DONG | DA_DONG | MIEN_GIAM | QUA_HAN',
    `hinh_thuc`      VARCHAR(30)  COMMENT 'TIEN_MAT | CHUYEN_KHOAN | WEBHOOK_AUTO',
    `ngay_dong`      DATE,
    `ghi_chu`        VARCHAR(500),
    -- Webhook / ngân hàng tự động
    `transaction_id` VARCHAR(150) COMMENT 'Mã GD ngân hàng (từ Casso/SePay webhook)',
    `noi_dung_ck`    VARCHAR(500) COMMENT 'Nội dung chuyển khoản gốc',
    `so_tien_ck`     DECIMAL(12,0) COMMENT 'Số tiền thực nhận (có thể khác so_tien)',
    `nguon`          VARCHAR(30)  DEFAULT 'MANUAL'
                     COMMENT 'MANUAL | CASSO | SEPAY | PAYOS',
    -- Audit
    `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_by`     VARCHAR(100),
    `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`     VARCHAR(100),

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_phi_clb_sv_hk` (`ma_clb`, `ma_sv`, `ma_hoc_ky`),
    UNIQUE KEY `uq_transaction_id` (`transaction_id`),
    INDEX `idx_phi_clb`       (`ma_clb`),
    INDEX `idx_phi_sv`        (`ma_sv`),
    INDEX `idx_phi_trang_thai`(`trang_thai`),
    CONSTRAINT `fk_phi_clb`   FOREIGN KEY (`ma_clb`)    REFERENCES `cau_lac_bo` (`ma_clb`),
    CONSTRAINT `fk_phi_sv`    FOREIGN KEY (`ma_sv`)     REFERENCES `sinhvien`   (`ma_sv`),
    CONSTRAINT `fk_phi_hk`    FOREIGN KEY (`ma_hoc_ky`) REFERENCES `hoc_ky`     (`ma_hoc_ky`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đóng phí thành viên CLB/Đội/Nhóm theo học kỳ';

-- ── Cấu hình webhook ngân hàng của CLB ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `clb_payment_config` (
    `ma_clb`             VARCHAR(20)  NOT NULL,
    `bank_account_no`    VARCHAR(30)  COMMENT 'Số tài khoản ngân hàng CLB',
    `bank_name`          VARCHAR(50)  COMMENT 'Tên ngân hàng (MB, VCB, TCB...)',
    `account_name`       VARCHAR(200) COMMENT 'Tên chủ tài khoản',
    `so_tien_phi`        DECIMAL(12,0) NOT NULL DEFAULT 50000 COMMENT 'Mức phí mặc định / kỳ',
    `ma_xac_thuc`        VARCHAR(100) COMMENT 'Prefix nội dung CK (VD: PHICLB CLB001)',
    `webhook_secret`     VARCHAR(200) COMMENT 'Secret token từ Casso/SePay để verify webhook',
    `webhook_provider`   VARCHAR(20)  DEFAULT 'CASSO' COMMENT 'CASSO | SEPAY',
    `is_active`          BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_clb`),
    CONSTRAINT `fk_cfg_clb` FOREIGN KEY (`ma_clb`) REFERENCES `cau_lac_bo` (`ma_clb`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cấu hình thanh toán / webhook ngân hàng cho từng CLB';

-- Permissions
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
('CLB', 'QUAN_LY_PHI_CLB', 'Quản lý đóng phí thành viên CLB');

INSERT IGNORE INTO `role_permissions` (`role_name`, `permission_id`)
SELECT r.role_name, p.id
FROM (SELECT 'ADMIN' AS role_name UNION ALL SELECT 'BCH_LEVEL_1' UNION ALL SELECT 'BCH_LEVEL_2') r
JOIN `permissions` p ON p.name = 'QUAN_LY_PHI_CLB';
