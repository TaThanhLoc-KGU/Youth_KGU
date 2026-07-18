-- Thêm cột trang_thai cho soft-delete (HIEU_LUC / DA_HUY)
ALTER TABLE danh_sach_ban_hanh
    ADD COLUMN trang_thai VARCHAR(20) NOT NULL DEFAULT 'HIEU_LUC',
    ADD COLUMN ngay_huy   DATETIME    NULL,
    ADD COLUMN nguoi_huy  VARCHAR(100) NULL;
