-- V16: Đảm bảo vai trò SINH_VIEN có đủ quyền cơ bản trong role_permissions.
-- Dùng INSERT IGNORE để an toàn nếu đã có sẵn.

INSERT IGNORE INTO `role_permissions` (`role_name`, `permission_id`) VALUES
-- Hệ thống cơ bản
('SINH_VIEN', 1),   -- DOI_MAT_KHAU
('SINH_VIEN', 2),   -- XEM_THONG_TIN_CA_NHAN
('SINH_VIEN', 3),   -- SUA_THONG_TIN_CA_NHAN
-- Hoạt động
('SINH_VIEN', 28),  -- XEM_HOAT_DONG
('SINH_VIEN', 33),  -- DANG_KY_HOAT_DONG
('SINH_VIEN', 34),  -- HUY_DANG_KY_HOAT_DONG
('SINH_VIEN', 35);  -- XEM_LICH_SU_THAM_GIA
