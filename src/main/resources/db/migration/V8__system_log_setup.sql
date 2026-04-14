-- V8: Thiết lập System Log
-- 1. Đảm bảo bảng system_log tồn tại (Hibernate ddl-auto=update sẽ tạo,
--    nhưng thêm ở đây để đảm bảo không thiếu khi chạy migration thủ công)
CREATE TABLE IF NOT EXISTS system_log (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    action         VARCHAR(100) NOT NULL,
    created_at     DATETIME NOT NULL,
    duration_ms    BIGINT,
    entity_id      VARCHAR(100),
    entity_type    VARCHAR(100),
    error_details  TEXT,
    ip_address     VARCHAR(50),
    log_level      ENUM('TRACE','DEBUG','INFO','WARN','ERROR','FATAL') NOT NULL DEFAULT 'INFO',
    message        TEXT NOT NULL,
    module         VARCHAR(100) NOT NULL,
    new_value      TEXT,
    old_value      TEXT,
    request_method VARCHAR(10),
    request_url    VARCHAR(500),
    session_id     VARCHAR(100),
    status         VARCHAR(50),
    user_agent     VARCHAR(500),
    user_id        VARCHAR(100),
    user_name      VARCHAR(200),
    INDEX idx_sl_created_at (created_at),
    INDEX idx_sl_module (module),
    INDEX idx_sl_action (action),
    INDEX idx_sl_user_id (user_id),
    INDEX idx_sl_status (status),
    INDEX idx_sl_log_level (log_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Thêm permission XEM_SYSTEM_LOG nếu chưa có
INSERT IGNORE INTO permissions (category, name, description)
VALUES ('SYSTEM', 'XEM_SYSTEM_LOG', 'Xem nhật ký hệ thống (System Log)');
