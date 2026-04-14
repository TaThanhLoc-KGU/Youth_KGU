-- V14__ky_so_quyen_email_config.sql
-- 1. Thêm quyền KY_SO_PDF (id 59) cho chức năng ký số
-- 2. Tạo bảng cau_hinh_email để lưu cấu hình SMTP trong DB

-- Quyền ký số PDF (id 59)
INSERT IGNORE INTO permissions (id, category, name, description)
VALUES (59, 'KY_SO', 'KY_SO_PDF', 'Ký số và xuất danh sách PDF có chữ ký điện tử');

-- Bảng cấu hình email (lưu trong DB, admin thay đổi runtime không cần restart)
CREATE TABLE IF NOT EXISTS cau_hinh_email (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    smtp_host       VARCHAR(255)  NOT NULL DEFAULT 'smtp.gmail.com',
    smtp_port       INT           NOT NULL DEFAULT 587,
    username        VARCHAR(255)  NOT NULL DEFAULT '',
    mat_khau        VARCHAR(500)  NOT NULL DEFAULT '' COMMENT 'App password SMTP',
    from_address    VARCHAR(255)  NOT NULL DEFAULT 'noreply@kgu.edu.vn',
    from_name       VARCHAR(255)  NOT NULL DEFAULT 'Đoàn Trường ĐH Kiên Giang',
    tls_enabled     BOOLEAN DEFAULT TRUE  COMMENT 'STARTTLS (port 587)',
    ssl_enabled     BOOLEAN DEFAULT FALSE COMMENT 'SSL/TLS (port 465)',
    kich_hoat       BOOLEAN DEFAULT FALSE COMMENT 'true=gửi thật, false=chỉ log console',
    ghi_chu         TEXT,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by      VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cấu hình SMTP — admin sửa runtime không cần restart';

-- Bản ghi mặc định (chỉ insert 1 lần)
INSERT IGNORE INTO cau_hinh_email (id, smtp_host, smtp_port, username, mat_khau, from_address, from_name, tls_enabled, ssl_enabled, kich_hoat)
VALUES (1, 'smtp.gmail.com', 587, '', '', 'noreply@kgu.edu.vn', 'Đoàn Trường ĐH Kiên Giang', TRUE, FALSE, FALSE);
