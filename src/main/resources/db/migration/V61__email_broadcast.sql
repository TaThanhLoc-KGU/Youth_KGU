-- V61__email_broadcast.sql
-- LƯU Ý QUAN TRỌNG: Flyway đang tắt (spring.flyway.enabled=false).
--
-- Bảng email_group / email_template được Hibernate ddl-auto=update TỰ TẠO khi app khởi
-- động (dựa theo @Entity EmailGroup / EmailTemplate) — phần CREATE TABLE bên dưới chỉ để
-- tài liệu/tham khảo, không cần chạy tay.
--
-- Phần INSERT permissions CŨNG chỉ để tài liệu — permission thực tế được tạo bởi
-- DataInitializer.initializePermissions() (chạy mỗi lần app khởi động).
--
-- Phần INSERT role_default_permissions KHÔNG có code tương đương nào chạy tự động
-- (giống hệt tình huống ở V54/V60). PHẢI CHẠY TAY 1 LẦN trên DB sau khi deploy:
--   mysql -u youthkgu -p youth-kgu < V61__email_broadcast.sql
-- Nếu bỏ qua bước này, cán bộ khoa (QUAN_LY_KHOA/PHO_QUAN_LY_KHOA) sẽ bị 403 khi vào
-- tính năng "Soạn & Gửi Email" — chỉ tài khoản ADMIN (bypass mọi permission check) dùng được.

SET NAMES utf8mb4;

-- ma_khoa PHẢI cùng collation với khoa.ma_khoa (varchar(50) COLLATE utf8mb4_unicode_ci) — nếu
-- không, mọi JOIN giữa 2 bảng (vd: EmailGroupRepository.findByKhoaScopeOrGlobal) lỗi "Illegal
-- mix of collations". Bản thân entity EmailGroup.java đã khai columnDefinition đúng ngay từ đầu,
-- nhưng ddl-auto=update KHÔNG tự sửa lại collation của cột đã tồn tại — dòng ALTER TABLE bên dưới
-- (an toàn để chạy nhiều lần) fix cho trường hợp bảng đã lỡ được tạo trước khi entity có fix này.
CREATE TABLE IF NOT EXISTS email_group (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_nhom      VARCHAR(200)  NOT NULL,
    dia_chi_email VARCHAR(255)  NOT NULL,
    ma_khoa       VARCHAR(50) COLLATE utf8mb4_unicode_ci NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    DATETIME,
    updated_at    DATETIME,
    CONSTRAINT fk_email_group_khoa FOREIGN KEY (ma_khoa) REFERENCES khoa(ma_khoa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE email_group MODIFY ma_khoa VARCHAR(50) COLLATE utf8mb4_unicode_ci NULL;

CREATE TABLE IF NOT EXISTS email_template (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_mau    VARCHAR(200)  NOT NULL,
    tieu_de    VARCHAR(300)  NOT NULL,
    noi_dung   LONGTEXT      NOT NULL,
    nguoi_tao  VARCHAR(50),
    is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO permissions (name, description, category)
SELECT * FROM (SELECT 'GUI_EMAIL_HANG_LOAT' AS name,
       'Quản lý nhóm mail/mẫu email và soạn, gửi email hàng loạt tới các nhóm' AS description,
       'EMAIL' AS category) t
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'GUI_EMAIL_HANG_LOAT');

-- Cán bộ khoa quản lý và gửi được cho nhóm mail của khoa mình (đúng yêu cầu nghiệp vụ:
-- "mỗi khoa có 1 mail group riêng") + các nhóm chung không gắn khoa nào.
INSERT IGNORE INTO role_default_permissions (vai_tro, permission_id)
SELECT 'QUAN_LY_KHOA', id FROM permissions WHERE name = 'GUI_EMAIL_HANG_LOAT';

INSERT IGNORE INTO role_default_permissions (vai_tro, permission_id)
SELECT 'PHO_QUAN_LY_KHOA', id FROM permissions WHERE name = 'GUI_EMAIL_HANG_LOAT';

-- ADMIN không cần insert — CustomPermissionEvaluator bypass toàn bộ quyền cho ADMIN.

-- Kiểm tra kết quả sau khi chạy:
-- SELECT vai_tro, COUNT(*) FROM role_default_permissions
--   WHERE permission_id IN (SELECT id FROM permissions WHERE name = 'GUI_EMAIL_HANG_LOAT')
--   GROUP BY vai_tro;
