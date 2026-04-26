-- Fix: Mở rộng cột cap_do để chứa giá trị 'BAN_DOI_CLB' và 'HOAT_DONG_PHOI_HOP'
-- Lý do: V20 có ALTER TABLE nhưng bị comment out, dẫn đến Data truncated khi lưu enum mới
ALTER TABLE hoat_dong MODIFY cap_do VARCHAR(50) NOT NULL;
