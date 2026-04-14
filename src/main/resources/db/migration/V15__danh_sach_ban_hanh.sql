-- V15__danh_sach_ban_hanh.sql
-- Bảng lưu danh sách đã ban hành chính thức (có chữ ký số)
CREATE TABLE IF NOT EXISTS danh_sach_ban_hanh (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_hoat_dong    VARCHAR(100)  NOT NULL COMMENT 'Mã hoạt động',
    ten_hoat_dong   VARCHAR(500)           COMMENT 'Tên hoạt động',
    loai_ky         VARCHAR(50)            COMMENT 'BÍ THƯ / PHÓ BÍ THƯ',
    ten_nguoi_ky    VARCHAR(255)           COMMENT 'Họ tên người ký BTV',
    ten_nguoi_lap   VARCHAR(255)           COMMENT 'Họ tên người lập danh sách',
    chuc_vu_nguoi_lap VARCHAR(255)         COMMENT 'Chức vụ người lập',
    co_con_dau      BOOLEAN DEFAULT FALSE,
    tong_sv         INT DEFAULT 0          COMMENT 'Tổng số sinh viên',
    ten_file        VARCHAR(500)           COMMENT 'Tên file PDF',
    duong_dan_file  VARCHAR(1000)          COMMENT 'Đường dẫn file PDF trên server',
    nguoi_ban_hanh  VARCHAR(255)           COMMENT 'Username người ban hành',
    ip_address      VARCHAR(64),
    ghi_chu         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bh_hoat_dong (ma_hoat_dong)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh sách điểm danh đã ban hành chính thức có chữ ký số';
