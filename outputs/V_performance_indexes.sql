-- =============================================================
-- V_performance_indexes.sql
-- Thêm Database Index để tăng tốc query — chạy 1 lần trên server
-- DB: face_attendance_activity (MariaDB 10.4+)
-- Ngày tạo: 2026-03-07
--
-- Các index dưới đây nhắm vào các cột được WHERE/JOIN/ORDER BY nhiều nhất
-- Dùng IF NOT EXISTS để có thể chạy lại an toàn mà không bị lỗi duplicate
-- =============================================================

-- ============================================================
-- 1. hoat_dong — bảng trung tâm, được filter nhiều nhất
-- ============================================================

-- Filter theo is_active (gần như mọi query đều có AND is_active = 1)
CREATE INDEX IF NOT EXISTS idx_hoat_dong_is_active
    ON hoat_dong (is_active);

-- Filter theo trạng thái (dashboard, danh sách theo status)
CREATE INDEX IF NOT EXISTS idx_hoat_dong_trang_thai
    ON hoat_dong (trang_thai);

-- Composite: is_active + trang_thai — khớp với findByTrangThaiAndIsActive()
CREATE INDEX IF NOT EXISTS idx_hoat_dong_active_status
    ON hoat_dong (is_active, trang_thai);

-- Filter / ORDER BY theo ngày tổ chức (findUpcomingActivities, findByDateRange)
CREATE INDEX IF NOT EXISTS idx_hoat_dong_ngay_to_chuc
    ON hoat_dong (ngay_to_chuc);

-- Composite: is_active + ngay_to_chuc — cho findUpcomingActivities và findByDateRange
CREATE INDEX IF NOT EXISTS idx_hoat_dong_active_ngay
    ON hoat_dong (is_active, ngay_to_chuc);

-- GROUP BY theo loai_hoat_dong, cap_do (statistics overview)
CREATE INDEX IF NOT EXISTS idx_hoat_dong_loai
    ON hoat_dong (loai_hoat_dong);

CREATE INDEX IF NOT EXISTS idx_hoat_dong_cap_do
    ON hoat_dong (cap_do);

-- FK lookups
CREATE INDEX IF NOT EXISTS idx_hoat_dong_ma_bch
    ON hoat_dong (ma_bch_phu_trach);

CREATE INDEX IF NOT EXISTS idx_hoat_dong_ma_khoa
    ON hoat_dong (ma_khoa);

CREATE INDEX IF NOT EXISTS idx_hoat_dong_ma_nganh
    ON hoat_dong (ma_nganh);

-- ============================================================
-- 2. dang_ky_hoat_dong — bảng đăng ký, COUNT nhiều nhất
-- ============================================================

-- COUNT đăng ký theo hoạt động (N+1 cũ, bây giờ GROUP BY nhưng vẫn cần index)
CREATE INDEX IF NOT EXISTS idx_dk_ma_hoat_dong_active
    ON dang_ky_hoat_dong (ma_hoat_dong, is_active);

-- Lookup đăng ký theo sinh viên
CREATE INDEX IF NOT EXISTS idx_dk_ma_sv_active
    ON dang_ky_hoat_dong (ma_sv, is_active);

-- Lookup QR code (dùng khi quét QR check-in)
CREATE INDEX IF NOT EXISTS idx_dk_ma_qr
    ON dang_ky_hoat_dong (ma_qr);

-- Filter theo da_xac_nhan (danh sách chờ xác nhận)
CREATE INDEX IF NOT EXISTS idx_dk_hoat_dong_xac_nhan
    ON dang_ky_hoat_dong (ma_hoat_dong, da_xac_nhan, is_active);

-- ============================================================
-- 3. diem_danh_hoat_dong — bảng điểm danh
-- ============================================================

-- COUNT/JOIN theo hoạt động (countByHoatDongMaHoatDong, findCheckedInStudents)
CREATE INDEX IF NOT EXISTS idx_dd_ma_hoat_dong
    ON diem_danh_hoat_dong (ma_hoat_dong);

-- Composite: hoat_dong + trang_thai (countByHoatDongMaHoatDongAndTrangThai)
CREATE INDEX IF NOT EXISTS idx_dd_hoat_dong_trang_thai
    ON diem_danh_hoat_dong (ma_hoat_dong, trang_thai);

-- Lookup theo sinh viên
CREATE INDEX IF NOT EXISTS idx_dd_ma_sv
    ON diem_danh_hoat_dong (ma_sv);

-- Composite: sinh viên + hoạt động (existsBySinhVienMaSvAndHoatDongMaHoatDong)
CREATE INDEX IF NOT EXISTS idx_dd_sv_hoat_dong
    ON diem_danh_hoat_dong (ma_sv, ma_hoat_dong);

-- Lookup QR đã quét (isQRAlreadyUsed, findByMaQRDaQuet)
CREATE INDEX IF NOT EXISTS idx_dd_ma_qr_da_quet
    ON diem_danh_hoat_dong (ma_qr_da_quet);

-- Filter theo BCH người check-in (findByNguoiCheckInMaBch)
CREATE INDEX IF NOT EXISTS idx_dd_ma_bch_check_in
    ON diem_danh_hoat_dong (ma_bch_check_in);

-- Range query theo thời gian check-in (findByThoiGianCheckInBetween, findByStudentAndMonth)
CREATE INDEX IF NOT EXISTS idx_dd_thoi_gian_check_in
    ON diem_danh_hoat_dong (thoi_gian_check_in);

-- ============================================================
-- 4. Bảng phụ trợ thường xuyên JOIN
-- ============================================================

-- sinhvien — JOIN nhiều qua ma_sv
CREATE INDEX IF NOT EXISTS idx_sv_ma_lop
    ON sinhvien (ma_lop);

CREATE INDEX IF NOT EXISTS idx_sv_ma_nganh
    ON sinhvien (ma_nganh);

-- tai_khoan — login lookup và JOIN với BCH
-- (username đã là UNIQUE nên MariaDB tự tạo index, nhưng kiểm tra thêm)
-- Bỏ qua nếu đã có UNIQUE KEY trên username

-- notifications — filter theo người nhận và trạng thái đọc
CREATE INDEX IF NOT EXISTS idx_notif_tai_khoan_id
    ON notifications (tai_khoan_id);

CREATE INDEX IF NOT EXISTS idx_notif_is_read
    ON notifications (tai_khoan_id, is_read);

-- ============================================================
-- 5. Xác nhận index đã tạo (chạy sau để kiểm tra)
-- ============================================================
-- SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
-- FROM information_schema.STATISTICS
-- WHERE TABLE_SCHEMA = DATABASE()
-- ORDER BY TABLE_NAME, INDEX_NAME;

SELECT 'Index creation completed successfully!' AS status;
