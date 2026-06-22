-- V27: Ban Chủ Nhiệm CLB + Activity Approval Workflow
-- =====================================================================

-- 1. Thêm cột approval workflow vào bảng hoat_dong
-- =====================================================================
ALTER TABLE hoat_dong
    ADD COLUMN nguoi_duyet   VARCHAR(100)    NULL COMMENT 'Tài khoản duyệt hoạt động',
    ADD COLUMN ngay_duyet    DATETIME        NULL COMMENT 'Thời điểm duyệt',
    ADD COLUMN ly_do_tu_choi TEXT            NULL COMMENT 'Lý do từ chối (nếu có)';

-- 2. Bảng Ban Chủ Nhiệm CLB (BCN)
-- Tách biệt với thanh_vien_clb để quản lý nhiệm kỳ riêng
-- =====================================================================
CREATE TABLE ban_chu_nhiem_clb (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    ma_clb      VARCHAR(20)     NOT NULL COMMENT 'FK → cau_lac_bo',
    ma_sv       VARCHAR(50)     NOT NULL COMMENT 'FK → sinhvien',

    -- Chức vụ trong BCN (tự định nghĩa hoặc từ danh mục)
    chuc_vu     VARCHAR(100)    NOT NULL COMMENT 'Chủ nhiệm | Phó chủ nhiệm | Ủy viên | Kế toán | Thủ quỹ | ...',

    -- Nhiệm kỳ: "2023-2024", "2024-2025"
    nhiem_ky    VARCHAR(20)     NOT NULL COMMENT 'Nhiệm kỳ hoạt động, VD: 2024-2025',

    -- Trạng thái
    trang_thai  VARCHAR(20)     NOT NULL DEFAULT 'DUONG_NHIEM'
                                COMMENT 'DUONG_NHIEM | THOI_CHUC',

    -- Liên hệ
    email_lien_he   VARCHAR(100)    NULL,
    sdt             VARCHAR(20)     NULL,

    ngay_bo_nhiem   DATE            NULL COMMENT 'Ngày bắt đầu nhận chức',
    ngay_thoi_chuc  DATE            NULL COMMENT 'Ngày thôi chức (nếu THOI_CHUC)',
    ghi_chu         TEXT            NULL,

    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_bcn_sv_clb_nhiem_ky (ma_clb, ma_sv, nhiem_ky),
    CONSTRAINT fk_bcn_clb FOREIGN KEY (ma_clb) REFERENCES cau_lac_bo (ma_clb),
    CONSTRAINT fk_bcn_sv  FOREIGN KEY (ma_sv)  REFERENCES sinhvien (ma_sv)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ban Chủ Nhiệm CLB theo từng nhiệm kỳ';

-- 3. Thêm permission DUYET_HOAT_DONG_CLB
-- =====================================================================
INSERT IGNORE INTO permissions (category, name, description)
VALUES ('HOAT_DONG', 'DUYET_HOAT_DONG_CLB', 'Phê duyệt hoạt động do CLB/Đoàn Khoa tạo');

-- Gán quyền DUYET_HOAT_DONG_CLB cho Admin và BCH level 1-2
INSERT IGNORE INTO role_permissions (role_name, permission_id)
SELECT r.role_name, p.id
FROM (SELECT 'ADMIN' AS role_name UNION ALL SELECT 'BCH_LEVEL_1' UNION ALL SELECT 'BCH_LEVEL_2') r
CROSS JOIN permissions p
WHERE p.name = 'DUYET_HOAT_DONG_CLB';

-- 4. Thêm permission QUAN_LY_BCN_CLB
-- =====================================================================
INSERT IGNORE INTO permissions (category, name, description)
VALUES ('CLB', 'QUAN_LY_BCN_CLB', 'Quản lý Ban Chủ Nhiệm CLB (thêm/sửa/xóa nhân sự BCN)');

INSERT IGNORE INTO role_permissions (role_name, permission_id)
SELECT r.role_name, p.id
FROM (SELECT 'ADMIN' AS role_name UNION ALL SELECT 'BCH_LEVEL_1'
      UNION ALL SELECT 'BCH_LEVEL_2' UNION ALL SELECT 'BCH_LEVEL_3') r
CROSS JOIN permissions p
WHERE p.name = 'QUAN_LY_BCN_CLB';
