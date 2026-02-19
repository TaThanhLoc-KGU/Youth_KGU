-- Cập nhật enum cap_do trong bảng hoat_dong
ALTER TABLE hoat_dong MODIFY COLUMN cap_do ENUM('DOAN_TRUONG', 'HOI_SINH_VIEN', 'TRUONG', 'PHONG', 'KHOA', 'CHI_DOAN', 'TINH_DOAN', 'HOAT_DONG_PHOI_HOP') NOT NULL DEFAULT 'TRUONG';
