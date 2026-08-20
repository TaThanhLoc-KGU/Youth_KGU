-- V58__gop_y.sql
-- LƯU Ý: Flyway đang tắt (spring.flyway.enabled=false), ddl-auto=update tự tạo bảng này
-- từ Entity Java. File này chỉ là tài liệu mô tả schema.

-- Thùng thư góp ý — sinh viên phản ánh/góp ý về hoạt động Đoàn-Hội.
-- Danh tính người gửi (nguoi_gui_username) được lưu để chống lạm dụng và để
-- người gửi xem lại lịch sử của chính mình, nhưng KHÔNG BAO GIỜ được trả về
-- trong DTO admin (đảm bảo tính minh bạch/dân chủ — xem GopYAdminDTO).
CREATE TABLE IF NOT EXISTS gop_y (
    id                  BIGINT        AUTO_INCREMENT PRIMARY KEY,
    tieu_de             VARCHAR(300)  NOT NULL                COMMENT 'Tiêu đề góp ý/phản ánh',
    noi_dung            TEXT          NOT NULL,
    loai                VARCHAR(20)   NOT NULL DEFAULT 'GOP_Y' COMMENT 'PHAN_ANH | GOP_Y | KHAC',
    nguoi_gui_username  VARCHAR(50)   NOT NULL                COMMENT 'FK mềm -> tai_khoan.username — CHỈ dùng nội bộ / self-view, KHÔNG trả về DTO admin',
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'MOI'   COMMENT 'MOI | DANG_XU_LY | DA_XU_LY | TU_CHOI',
    phan_hoi            TEXT          NULL                    COMMENT 'Nội dung phản hồi từ BCH/Admin',
    nguoi_phan_hoi      VARCHAR(50)   NULL                    COMMENT 'FK mềm — username người phản hồi (không cần ẩn — là admin)',
    ngay_phan_hoi       DATETIME      NULL,
    is_deleted          TINYINT(1)    NOT NULL DEFAULT 0,
    created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_gy_nguoi_gui  (nguoi_gui_username),
    INDEX idx_gy_trang_thai (trang_thai),
    INDEX idx_gy_is_deleted (is_deleted),
    INDEX idx_gy_created    (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thùng thư góp ý — danh tính người gửi bị ẩn khi hiển thị cho admin';
