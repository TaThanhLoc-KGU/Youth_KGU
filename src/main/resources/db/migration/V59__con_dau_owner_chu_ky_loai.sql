-- V59__con_dau_owner_chu_ky_loai.sql
-- LƯU Ý: Flyway đang tắt (spring.flyway.enabled=false), ddl-auto=update tự tạo cột này
-- từ Entity Java. File này chỉ là tài liệu mô tả schema.

-- Con dấu thành chức năng phân quyền: NULL = dùng chung cho ai có quyền KY_SO_PDF,
-- không NULL = chỉ tài khoản đó dùng được (mirror chu_ky.owner_username).
ALTER TABLE con_dau ADD COLUMN owner_username VARCHAR(100) NULL
    COMMENT 'Username sở hữu con dấu. NULL = dùng chung';

-- Ký nháy: tái dùng bảng chu_ky hiện có (cấu trúc giống hệt 1 chữ ký, chỉ khác
-- vị trí vẽ lên PDF) — thêm cột phân loại thay vì tạo bảng mới.
ALTER TABLE chu_ky ADD COLUMN loai_chu_ky VARCHAR(20) NOT NULL DEFAULT 'FULL'
    COMMENT 'FULL = chữ ký đầy đủ (trang cuối) | NHAY = ký nháy (mọi trang trừ trang cuối)';
