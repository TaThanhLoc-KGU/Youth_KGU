-- V13__ky_so_lich_su.sql
-- Bảng lưu lịch sử ký số: ai ký, ai tải file
CREATE TABLE ky_so_lich_su (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_hoat_dong    VARCHAR(100)  NOT NULL COMMENT 'Mã hoạt động',
    ten_hoat_dong   VARCHAR(500)           COMMENT 'Tên hoạt động',
    loai_ky         VARCHAR(50)            COMMENT 'BÍ THƯ / PHÓ BÍ THƯ',
    ten_nguoi_ky    VARCHAR(255)           COMMENT 'Tên người ký bên trái (BTV)',
    ten_nguoi_lap   VARCHAR(255)           COMMENT 'Tên người lập danh sách',
    co_con_dau      BOOLEAN DEFAULT FALSE  COMMENT 'Có đóng dấu hay không',
    nguoi_thuc_hien VARCHAR(255)           COMMENT 'Username người thực hiện ký',
    ip_address      VARCHAR(64)            COMMENT 'IP người thực hiện',
    ten_file        VARCHAR(500)           COMMENT 'Tên file PDF đã xuất',
    tong_sv         INT DEFAULT 0          COMMENT 'Tổng số sinh viên trong danh sách',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lịch sử ký số: ghi lại mỗi lần xuất PDF có ký';

-- Index tra cứu nhanh theo hoạt động và người thực hiện
CREATE INDEX idx_ksl_hoat_dong ON ky_so_lich_su(ma_hoat_dong);
CREATE INDEX idx_ksl_nguoi ON ky_so_lich_su(nguoi_thuc_hien);
