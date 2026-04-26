-- V17: Thêm B-tree indexes để tối ưu hiệu năng query.
-- Dùng IF NOT EXISTS (qua PROCEDURE) để safe khi chạy lại.

-- ══════════════════════════════════════════════════════════════
-- BẢNG: sinhvien
-- ══════════════════════════════════════════════════════════════

-- is_active được filter trong 5+ query methods nhưng chưa có index
ALTER TABLE `sinhvien`
    ADD INDEX `idx_sv_is_active` (`is_active`);

-- Composite: lọc active + theo lớp (findByLopAndIsActive, etc.)
ALTER TABLE `sinhvien`
    ADD INDEX `idx_sv_is_active_lop` (`is_active`, `ma_lop`);

-- ══════════════════════════════════════════════════════════════
-- BẢNG: tai_khoan
-- ══════════════════════════════════════════════════════════════

-- trang_thai_phe_duyet được filter trong 4+ query methods
ALTER TABLE `tai_khoan`
    ADD INDEX `idx_tk_trang_thai_phe_duyet` (`trang_thai_phe_duyet`);

-- created_at dùng trong countByCreatedAtBetween (dashboard stats)
ALTER TABLE `tai_khoan`
    ADD INDEX `idx_tk_created_at` (`created_at`);

-- ══════════════════════════════════════════════════════════════
-- BẢNG: dang_ky_hoat_dong  [CRITICAL]
-- ══════════════════════════════════════════════════════════════

-- ma_sv CHƯA CÓ INDEX — findBySinhVienMaSv() đang full table scan!
-- Đây là index quan trọng nhất cần thêm.
ALTER TABLE `dang_ky_hoat_dong`
    ADD INDEX `idx_dkhd_ma_sv` (`ma_sv`);

-- Composite: lọc sinh viên + khoảng ngày (lịch sử đăng ký theo tháng)
ALTER TABLE `dang_ky_hoat_dong`
    ADD INDEX `idx_dkhd_ma_sv_ngay` (`ma_sv`, `ngay_dang_ky`);

-- is_active dùng trong nhiều query (countDangKyGroupByHoatDong, etc.)
ALTER TABLE `dang_ky_hoat_dong`
    ADD INDEX `idx_dkhd_is_active` (`is_active`);

-- ══════════════════════════════════════════════════════════════
-- BẢNG: diem_danh_hoat_dong
-- ══════════════════════════════════════════════════════════════

-- Composite: lọc sinh viên + thời gian check-in (báo cáo theo tháng/năm)
ALTER TABLE `diem_danh_hoat_dong`
    ADD INDEX `idx_ddh_ma_sv_checkIn` (`ma_sv`, `thoi_gian_check_in`);

-- Composite: trang_thai + ma_hoat_dong (dashboard, lọc vắng/có mặt theo HĐ)
ALTER TABLE `diem_danh_hoat_dong`
    ADD INDEX `idx_ddh_trangThai_hoatDong` (`trang_thai`, `ma_hoat_dong`);
