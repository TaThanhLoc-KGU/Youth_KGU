-- ============================================================
-- V17: Permission Hotfix — Bổ sung & sửa permissions DB
-- Chạy file này thủ công trên server (aaPanel → MySQL):
--   source /opt/youth-kgu/V17__permission_hotfix.sql
-- ============================================================

-- ── 1. Bổ sung KY_SO_PDF (ID 59 đã bị chiếm bởi DANG_TIN_TUC) ──────────────
-- V14 dùng INSERT IGNORE với id=59 nhưng id đó đã là DANG_TIN_TUC → bị bỏ qua.
-- Fix: thêm với ID tự động (sau 69).
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`)
VALUES ('KY_SO', 'KY_SO_PDF', 'Ký số và xuất danh sách PDF có chữ ký điện tử');

-- ── 2. Đảm bảo CUOC_THI permissions tồn tại (từ V6) ────────────────────────
INSERT IGNORE INTO `permissions` (`category`, `name`, `description`)
VALUES
  ('CUOC_THI', 'QUAN_LY_CUOC_THI', 'Xem danh sách và chi tiết cuộc thi'),
  ('CUOC_THI', 'TAO_CUOC_THI',     'Tạo cuộc thi mới'),
  ('CUOC_THI', 'SUA_CUOC_THI',     'Sửa cuộc thi và quản lý thí sinh'),
  ('CUOC_THI', 'XOA_CUOC_THI',     'Xóa cuộc thi');

-- ── 3. Đảm bảo NEWS permissions đúng category (từ youth-kgu.sql có id 59-65) ─
-- Cập nhật category nếu sai (một số DB cũ lưu category='KY_SO' cho DANG_TIN_TUC)
UPDATE `permissions` SET `category` = 'NEWS'
WHERE `name` IN ('DANG_TIN_TUC','SUA_TIN_TUC','XOA_TIN_TUC','DUYET_TIN_TUC',
                 'QUAN_LY_CHUYEN_MUC','QUAN_LY_VAN_BAN','XOA_VAN_BAN');

-- ── 4. SINH_VIEN role_permissions — đảm bảo đủ quyền cơ bản (idempotent) ────
INSERT IGNORE INTO `role_permissions` (`role_name`, `permission_id`)
SELECT 'SINH_VIEN', id FROM `permissions`
WHERE `name` IN (
  'DOI_MAT_KHAU',          -- 1
  'XEM_THONG_TIN_CA_NHAN', -- 2
  'SUA_THONG_TIN_CA_NHAN', -- 3
  'XEM_HOAT_DONG',         -- 28
  'DANG_KY_HOAT_DONG',     -- 33
  'HUY_DANG_KY_HOAT_DONG', -- 34
  'XEM_LICH_SU_THAM_GIA'   -- 35
);

-- ── 5. Kiểm tra tình trạng tài khoản QUAN_LY ────────────────────────────────
-- Chạy query này để xem tài khoản nào CÒN THIẾU quyền:
--
-- SELECT t.id, t.username, t.vai_tro, t.la_admin,
--        COUNT(tkq.quyen_id) AS so_quyen
-- FROM taikhoan t
-- LEFT JOIN tai_khoan_quyen tkq ON t.id = tkq.tai_khoan_id
-- WHERE t.vai_tro = 'QUAN_LY' AND t.la_admin = FALSE
-- GROUP BY t.id, t.username, t.vai_tro, t.la_admin
-- HAVING so_quyen = 0;
--
-- Nếu có tài khoản → dùng đoạn 6 bên dưới để cấp quyền mặc định.

-- ── 6. (TÙY CHỌN) Cấp quyền mặc định cho tất cả QUAN_LY không có quyền ──────
-- Uncommment và chạy NẾU query ở bước 5 trả về kết quả.
-- Cấp bộ quyền BCH tiêu chuẩn (BCH_LEVEL_3):
--
-- INSERT IGNORE INTO tai_khoan_quyen (tai_khoan_id, quyen_id, created_at, created_by)
-- SELECT DISTINCT t.id, rp.permission_id, NOW(), 1
-- FROM taikhoan t
-- JOIN role_permissions rp ON rp.role_name = 'BCH_LEVEL_3'
-- WHERE t.vai_tro = 'QUAN_LY' AND t.la_admin = FALSE
--   AND NOT EXISTS (
--     SELECT 1 FROM tai_khoan_quyen tkq WHERE tkq.tai_khoan_id = t.id
--   );

-- ── 7. Xem tất cả permissions hiện có trong DB ──────────────────────────────
-- SELECT id, category, name, description FROM permissions ORDER BY id;

-- ── 8. Xem quyền của một tài khoản cụ thể ───────────────────────────────────
-- SELECT p.id, p.category, p.name
-- FROM tai_khoan_quyen tkq
-- JOIN permissions p ON tkq.quyen_id = p.id
-- JOIN taikhoan t ON t.id = tkq.tai_khoan_id
-- WHERE t.username = 'ten_tai_khoan'
-- ORDER BY p.id;
