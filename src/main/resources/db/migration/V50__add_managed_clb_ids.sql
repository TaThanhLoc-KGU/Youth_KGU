-- ============================================================
-- Migration: Thêm cột managed_clb_ids cho phân quyền CLB
-- ============================================================

ALTER TABLE taikhoan
    ADD COLUMN IF NOT EXISTS managed_clb_ids JSON DEFAULT '[]' COMMENT 'Danh sách CLB được quản lý (JSON array)';

-- Tạo index nếu chưa có
CREATE INDEX IF NOT EXISTS idx_managed_clb_ids ON taikhoan (managed_clb_ids(100));
