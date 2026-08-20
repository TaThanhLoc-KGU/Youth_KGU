-- V57__tin_tuc_binh_luan_luot_thich.sql
-- LƯU Ý: Flyway đang tắt (spring.flyway.enabled=false), ddl-auto=update tự tạo bảng/cột này
-- từ Entity Java. File này chỉ là tài liệu mô tả schema — chạy tay nếu cần áp trực tiếp.

-- Bảng bình luận bài viết eNews — hỗ trợ ẩn danh (khách) và tài khoản
CREATE TABLE IF NOT EXISTS tin_tuc_binh_luan (
    id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
    tin_tuc_id      BIGINT        NOT NULL                    COMMENT 'FK -> tin_tuc.id',
    username        VARCHAR(50)   NULL                        COMMENT 'FK mềm -> tai_khoan.username (NULL = khách)',
    ho_ten          VARCHAR(150)  NOT NULL                    COMMENT 'Tên hiển thị: snapshot hoTen tài khoản, hoặc tên khách nhập',
    so_dien_thoai   VARCHAR(20)   NULL                        COMMENT 'Chỉ có khi bình luận khách (guest)',
    email           VARCHAR(150)  NULL                        COMMENT 'Chỉ có khi bình luận khách (guest)',
    noi_dung        TEXT          NOT NULL,
    trang_thai      VARCHAR(20)   NOT NULL DEFAULT 'HIEN'      COMMENT 'HIEN=hiển thị, CHAN=admin chặn, DA_XOA=soft-delete',
    nguoi_xu_ly     VARCHAR(50)   NULL                        COMMENT 'FK mềm -> tai_khoan.username — admin đã chặn/xóa',
    ngay_xu_ly      DATETIME      NULL,
    ip_address      VARCHAR(64)   NULL                        COMMENT 'Truy vết lạm dụng cho bình luận khách',
    created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_bl_tin_tuc FOREIGN KEY (tin_tuc_id) REFERENCES tin_tuc(id) ON DELETE CASCADE,

    INDEX idx_bl_tin_tuc_trangthai (tin_tuc_id, trang_thai, created_at),
    INDEX idx_bl_username          (username)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bình luận trên bài viết eNews — hỗ trợ ẩn danh (khách) và tài khoản';


-- Bảng lượt thích — dedup theo username (đã đăng nhập) HOẶC device_id (ẩn danh)
CREATE TABLE IF NOT EXISTS tin_tuc_luot_thich (
    id          BIGINT        AUTO_INCREMENT PRIMARY KEY,
    tin_tuc_id  BIGINT        NOT NULL                        COMMENT 'FK -> tin_tuc.id',
    username    VARCHAR(50)   NULL                            COMMENT 'FK mềm — set khi đã đăng nhập',
    device_id   VARCHAR(100)  NULL                            COMMENT 'UUID sinh phía client, lưu localStorage — dedup ẩn danh',
    created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lt_tin_tuc FOREIGN KEY (tin_tuc_id) REFERENCES tin_tuc(id) ON DELETE CASCADE,

    UNIQUE KEY uq_lt_user   (tin_tuc_id, username),
    UNIQUE KEY uq_lt_device (tin_tuc_id, device_id),
    INDEX idx_lt_tin_tuc (tin_tuc_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lượt thích bài viết — 1 lượt / tài khoản hoặc 1 lượt / thiết bị ẩn danh';


-- Bổ sung bộ đếm tương tác + khóa bình luận vào tin_tuc
ALTER TABLE tin_tuc ADD COLUMN luot_thich     INT        NOT NULL DEFAULT 0 COMMENT 'Tổng lượt thích';
ALTER TABLE tin_tuc ADD COLUMN luot_binh_luan INT        NOT NULL DEFAULT 0 COMMENT 'Tổng bình luận đang HIEN';
ALTER TABLE tin_tuc ADD COLUMN luot_chia_se   INT        NOT NULL DEFAULT 0 COMMENT 'Tổng lượt chia sẻ';
ALTER TABLE tin_tuc ADD COLUMN khoa_binh_luan TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Khóa — không cho bình luận mới';
