-- V3: Fix production data + thêm cột chế độ điểm danh
-- Chạy script này trên production DB (MySQL)
-- ============================================================

-- 1. Fix dang_ky_hoat_dong: populate ma_qr = NULL (rows chưa có mã QR)
--    ma_qr = CONCAT(ma_hoat_dong, ma_sv) theo logic generateQRCode()
UPDATE dang_ky_hoat_dong
SET ma_qr = CONCAT(ma_hoat_dong, ma_sv)
WHERE ma_qr IS NULL OR ma_qr = '';

-- 2. Fix is_active = NULL → true (rows cũ khi column mới được add)
UPDATE dang_ky_hoat_dong
SET is_active = TRUE
WHERE is_active IS NULL;

-- 3. Thêm cột che_do_diem_danh vào hoat_dong nếu chưa có
ALTER TABLE hoat_dong
    ADD COLUMN IF NOT EXISTS che_do_diem_danh VARCHAR(30) NULL DEFAULT 'CHECKIN_CHECKOUT';

-- 4. Cập nhật các hoạt động cũ chưa có giá trị (NULL → CHECKIN_CHECKOUT)
UPDATE hoat_dong
SET che_do_diem_danh = 'CHECKIN_CHECKOUT'
WHERE che_do_diem_danh IS NULL;
