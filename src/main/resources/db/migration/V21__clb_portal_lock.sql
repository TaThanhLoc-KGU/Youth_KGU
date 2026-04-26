-- V21: CLB portal - add manager account link & semester lock
-- ─────────────────────────────────────────────────────────────

-- 1. Liên kết tài khoản quản lý CLB (dành cho GV / CV làm chủ nhiệm)
ALTER TABLE cau_lac_bo
    ADD COLUMN IF NOT EXISTS ma_quan_ly VARCHAR(50) NULL COMMENT 'ma_tai_khoan người quản lý CLB';

-- 2. Khóa danh sách thành viên CLB theo học kỳ
ALTER TABLE hoc_ky
    ADD COLUMN IF NOT EXISTS is_clb_locked BOOLEAN DEFAULT FALSE COMMENT 'Đã khóa danh sách thành viên CLB kỳ này',
    ADD COLUMN IF NOT EXISTS clb_locked_at DATETIME NULL COMMENT 'Thời điểm khóa danh sách CLB',
    ADD COLUMN IF NOT EXISTS clb_locked_by VARCHAR(50) NULL COMMENT 'Người thực hiện khóa';
