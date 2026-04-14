-- V5: Fix is_active = NULL trong bảng hoat_dong
-- Nguyên nhân: Hibernate tạo column is_active không có DEFAULT 1
-- nên các hoạt động cũ bị NULL thay vì TRUE → không hiển thị trên trang công khai

UPDATE hoat_dong
SET is_active = TRUE
WHERE is_active IS NULL;

-- Đảm bảo column có DEFAULT cho lần sau
ALTER TABLE hoat_dong
    MODIFY COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
