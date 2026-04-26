-- V23: Hỗ trợ hoạt động nhiều ngày (multi-day activities)
-- Thêm cột ngay_ket_thuc vào bảng hoat_dong
-- NULL = hoạt động 1 ngày (ngay_to_chuc = ngày duy nhất)
-- non-NULL = hoạt động nhiều ngày, kết thúc vào ngay_ket_thuc

ALTER TABLE hoat_dong
    ADD COLUMN IF NOT EXISTS ngay_ket_thuc DATE NULL
        COMMENT 'Ngày kết thúc hoạt động. NULL = 1 ngày (bằng ngay_to_chuc). Non-null = nhiều ngày.'
        AFTER ngay_to_chuc;

-- Index hỗ trợ query theo khoảng ngày
CREATE INDEX IF NOT EXISTS idx_hoat_dong_ngay_ket_thuc
    ON hoat_dong (ngay_ket_thuc);
