-- ============================================================
-- Migration: Thêm cột managed_clb_ids cho phân quyền CLB
-- ============================================================

-- Thêm cột managed_clb_ids vào bảng taikhoan
ALTER TABLE taikhoan ADD COLUMN managed_clb_ids JSON DEFAULT '[]' COMMENT 'Danh sách CLB được quản lý (JSON array)';

-- Index để tối ưu truy vấn
CREATE INDEX idx_managed_clb_ids ON taikhoan (managed_clb_ids(100));
