-- ============================================================
-- Migration: Thêm & tách quyền quản lý Ban/Đội/CLB  
-- ============================================================
-- Mục tiêu: Tách QUAN_LY_BAN (46) thành 4 quyền độc lập
-- XEM_BAN, THEM_BAN, SUA_BAN, XOA_BAN

-- Thêm 4 quyền mới (id 60-63)
INSERT INTO permissions (id, name, description, category, created_at) VALUES
(60, 'XEM_CLB', 'Xem danh sách CLB', 'TO_CHUC', NOW()),
(61, 'THEM_CLB', 'Thêm CLB mới', 'TO_CHUC', NOW()),
(62, 'SUA_CLB', 'Sửa thông tin CLB', 'TO_CHUC', NOW()),
(63, 'XOA_CLB', 'Xóa CLB', 'TO_CHUC', NOW())
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Gán 4 quyền mới cho ADMIN role
INSERT IGNORE INTO role_permissions (role_name, permission_id) VALUES
('ADMIN', 60),
('ADMIN', 61),
('ADMIN', 62),
('ADMIN', 63);

-- Gán cho Manager BCH cơ bản
INSERT IGNORE INTO role_permissions (role_name, permission_id) VALUES
('MANAGER', 60),  -- Xem CLB
('MANAGER', 61),  -- Thêm CLB
('MANAGER', 62),  -- Sửa CLB
('MANAGER', 63);  -- Xóa CLB

-- Lưu ý: Quyền QUAN_LY_BAN (46) vẫn giữ lại để tương thích ngược
-- Trong tương lai, có thể deprecated QUAN_LY_BAN sau khi migrate hết

-- ============================================================
-- PERMISSION MAPPING (dùng cho Frontend Constants)
-- ============================================================
-- ID | Name        | Description
-- 60 | XEM_CLB     | Xem danh sách CLB
-- 61 | THEM_CLB    | Thêm CLB mới
-- 62 | SUA_CLB     | Sửa thông tin CLB
-- 63 | XOA_CLB     | Xóa CLB
-- 46 | QUAN_LY_BAN | [DEPRECATED] Quản lý ban (gộp - giữ lại tương thích)
