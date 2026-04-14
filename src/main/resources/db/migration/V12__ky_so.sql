-- V12__ky_so.sql
-- Bảng lưu chữ ký (ảnh PNG nền trong suốt)
CREATE TABLE chu_ky (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_nguoi_ky VARCHAR(255) NOT NULL COMMENT 'Tên người ký',
    chuc_vu      VARCHAR(100)          COMMENT 'Chức vụ (BÍ THƯ, PHÓ BÍ THƯ, ...)',
    duong_dan    VARCHAR(500) NOT NULL COMMENT 'Đường dẫn file ảnh chữ ký',
    la_mac_dinh  BOOLEAN DEFAULT FALSE COMMENT 'Chữ ký mặc định',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lưu trữ chữ ký số (ảnh) của người ký';

-- Bảng lưu con dấu
CREATE TABLE con_dau (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten         VARCHAR(255) NOT NULL COMMENT 'Tên con dấu',
    duong_dan   VARCHAR(500) NOT NULL COMMENT 'Đường dẫn file ảnh con dấu',
    la_mac_dinh BOOLEAN DEFAULT FALSE COMMENT 'Con dấu mặc định',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lưu trữ hình ảnh con dấu';
