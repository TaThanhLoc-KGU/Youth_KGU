-- ============================================================
-- V55: Mẫu chứng nhận (template) — thay thế chứng nhận giấy
--
-- LƯU Ý: Flyway đang tắt (spring.flyway.enabled=false), ddl-auto=update tự tạo bảng/cột này
-- khi backend khởi động (không cần chạy tay file này) — giữ lại để đồng bộ lịch sử schema,
-- phòng khi Flyway được bật lại sau này (xem V54 cho bối cảnh đầy đủ).
-- ============================================================

CREATE TABLE IF NOT EXISTS `chung_nhan_template` (
    `id`            BIGINT PRIMARY KEY AUTO_INCREMENT,
    `ten`           VARCHAR(255) NOT NULL,
    `hinh_nen`      VARCHAR(500) NOT NULL COMMENT 'Đường dẫn ảnh nền, /uploads/chung-nhan-mau/...',
    `chieu_rong_px` INT NOT NULL,
    `chieu_cao_px`  INT NOT NULL,
    `fields`        TEXT COMMENT 'JSON: List<ChungNhanTemplateFieldDTO>',
    `is_active`     TINYINT(1) NOT NULL DEFAULT 1,
    `created_at`    DATETIME(6) DEFAULT NOW(6),
    `updated_at`    DATETIME(6) DEFAULT NOW(6) ON UPDATE NOW(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `chung_nhan_hoat_dong`
    ADD COLUMN IF NOT EXISTS `template_id` BIGINT NULL,
    ADD CONSTRAINT `fk_chungnhan_template` FOREIGN KEY (`template_id`)
        REFERENCES `chung_nhan_template`(`id`);
