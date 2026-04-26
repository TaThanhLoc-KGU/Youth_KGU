-- ============================================================
-- V19: Tách quyền granular + sửa bug ràng buộc chéo
-- Mục tiêu:
--   1. Tách QUAN_LY_* thành THEM/SUA/XOA riêng biệt cho từng module
--   2. Bổ sung XEM_CHUC_VU, XEM_BAN (sidebar cần)
--   3. Bổ sung EXPORT_SINH_VIEN, IMPORT_TAI_KHOAN
--   4. Bổ sung XUAT_DS_DIEM_DANH, XUAT_DS_DANG_KY (tách khỏi XUAT_BAO_CAO)
--   5. Bổ sung GIAO_DIEM_DANH (đã dùng trong controller nhưng thiếu trong DB)
-- Tất cả dùng INSERT IGNORE — an toàn khi chạy lại.
-- ============================================================

-- ── 1. CHUYEN_VIEN — tách QUAN_LY_CHUYEN_VIEN ─────────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('CHUYEN_VIEN', 'THEM_CHUYEN_VIEN', 'Thêm chuyên viên mới'),
  ('CHUYEN_VIEN', 'SUA_CHUYEN_VIEN',  'Sửa thông tin chuyên viên'),
  ('CHUYEN_VIEN', 'XOA_CHUYEN_VIEN',  'Xóa chuyên viên');

-- ── 2. TO_CHUC / KHOA — tách QUAN_LY_KHOA ─────────────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('TO_CHUC', 'THEM_KHOA', 'Thêm khoa mới'),
  ('TO_CHUC', 'SUA_KHOA',  'Sửa thông tin khoa'),
  ('TO_CHUC', 'XOA_KHOA',  'Xóa khoa');

-- ── 3. TO_CHUC / NGANH — tách QUAN_LY_NGANH ───────────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('TO_CHUC', 'THEM_NGANH', 'Thêm ngành mới'),
  ('TO_CHUC', 'SUA_NGANH',  'Sửa thông tin ngành'),
  ('TO_CHUC', 'XOA_NGANH',  'Xóa ngành');

-- ── 4. TO_CHUC / LOP — tách QUAN_LY_LOP ───────────────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('TO_CHUC', 'THEM_LOP', 'Thêm lớp mới'),
  ('TO_CHUC', 'SUA_LOP',  'Sửa thông tin lớp'),
  ('TO_CHUC', 'XOA_LOP',  'Xóa lớp');

-- ── 5. TO_CHUC / KHOA_HOC — tách QUAN_LY_KHOA_HOC ─────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('TO_CHUC', 'THEM_KHOA_HOC', 'Thêm khóa học mới'),
  ('TO_CHUC', 'SUA_KHOA_HOC',  'Sửa thông tin khóa học'),
  ('TO_CHUC', 'XOA_KHOA_HOC',  'Xóa khóa học');

-- ── 6. BCH / CHUC_VU — tách QUAN_LY_CHUC_VU ───────────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('BCH', 'XEM_CHUC_VU',  'Xem danh sách chức vụ'),
  ('BCH', 'THEM_CHUC_VU', 'Thêm chức vụ mới'),
  ('BCH', 'SUA_CHUC_VU',  'Sửa thông tin chức vụ'),
  ('BCH', 'XOA_CHUC_VU',  'Xóa chức vụ');

-- ── 7. BCH / BAN — tách QUAN_LY_BAN ───────────────────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('BCH', 'XEM_BAN',  'Xem danh sách Ban / Đội / CLB'),
  ('BCH', 'THEM_BAN', 'Thêm Ban / Đội / CLB mới'),
  ('BCH', 'SUA_BAN',  'Sửa thông tin Ban / Đội / CLB'),
  ('BCH', 'XOA_BAN',  'Xóa Ban / Đội / CLB');

-- ── 8. Export mới ──────────────────────────────────────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('SINH_VIEN', 'EXPORT_SINH_VIEN',   'Xuất danh sách sinh viên ra Excel'),
  ('TAI_KHOAN', 'IMPORT_TAI_KHOAN',   'Nhập danh sách tài khoản từ Excel');

-- ── 9. Tách báo cáo điểm danh (tránh dính XUAT_BAO_CAO hệ thống) ──────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('BAO_CAO', 'XUAT_DS_DIEM_DANH', 'Xuất danh sách điểm danh của hoạt động'),
  ('BAO_CAO', 'XUAT_DS_DANG_KY',   'Xuất danh sách đăng ký hoạt động');

-- ── 10. Điểm danh — GIAO_DIEM_DANH (đang dùng trong controller, thiếu DB) ─
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`) VALUES
  ('DIEM_DANH', 'GIAO_DIEM_DANH', 'Giao nhiệm vụ điểm danh cho tài khoản');

-- ── 11. Cấp quyền mới cho la_admin=TRUE thông qua role_permissions ADMIN ───
-- (la_admin bypass tất cả check nên không cần, nhưng đảm bảo nhất quán)
-- Không cần INSERT vào role_permissions vì la_admin=TRUE bypass toàn bộ.

-- ── Kiểm tra sau khi chạy ───────────────────────────────────────────────────
-- SELECT id, category, name, description FROM permissions
-- WHERE name IN (
--   'THEM_CHUYEN_VIEN','SUA_CHUYEN_VIEN','XOA_CHUYEN_VIEN',
--   'THEM_KHOA','SUA_KHOA','XOA_KHOA',
--   'THEM_NGANH','SUA_NGANH','XOA_NGANH',
--   'THEM_LOP','SUA_LOP','XOA_LOP',
--   'THEM_KHOA_HOC','SUA_KHOA_HOC','XOA_KHOA_HOC',
--   'XEM_CHUC_VU','THEM_CHUC_VU','SUA_CHUC_VU','XOA_CHUC_VU',
--   'XEM_BAN','THEM_BAN','SUA_BAN','XOA_BAN',
--   'EXPORT_SINH_VIEN','IMPORT_TAI_KHOAN',
--   'XUAT_DS_DIEM_DANH','XUAT_DS_DANG_KY','GIAO_DIEM_DANH'
-- ) ORDER BY id;
