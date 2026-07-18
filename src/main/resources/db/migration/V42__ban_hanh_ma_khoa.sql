-- Thêm cột ma_khoa vào danh_sach_ban_hanh để phân quyền thu hồi theo đoàn khoa
ALTER TABLE danh_sach_ban_hanh
    ADD COLUMN ma_khoa VARCHAR(20) NULL;
