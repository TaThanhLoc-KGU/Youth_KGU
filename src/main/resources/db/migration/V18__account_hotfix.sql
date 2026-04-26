-- ============================================================
-- V18: Account Hotfix — Sửa trạng thái tài khoản
-- Chạy file này thủ công trên server (aaPanel → MySQL):
--   source /opt/youth-kgu/V18__account_hotfix.sql
-- ============================================================

-- ── 1. Sửa admin (id=8): trang_thai_phe_duyet = NULL → DA_PHE_DUYET ──────────
UPDATE taikhoan
SET trang_thai_phe_duyet = 'DA_PHE_DUYET'
WHERE id = 8 AND (trang_thai_phe_duyet IS NULL OR trang_thai_phe_duyet = '');

-- ── 2. Đảm bảo tất cả tài khoản QUAN_LY có la_admin=TRUE đều được phê duyệt ──
UPDATE taikhoan
SET trang_thai_phe_duyet = 'DA_PHE_DUYET'
WHERE vai_tro = 'QUAN_LY'
  AND la_admin = TRUE
  AND (trang_thai_phe_duyet IS NULL OR trang_thai_phe_duyet = '');

-- ── 3. Đảm bảo tất cả tài khoản QUAN_LY có la_admin=TRUE đều is_active ───────
UPDATE taikhoan
SET is_active = TRUE
WHERE vai_tro = 'QUAN_LY'
  AND la_admin = TRUE
  AND (is_active IS NULL OR is_active = FALSE);

-- ── 4. Kiểm tra sau khi chạy ────────────────────────────────────────────────
-- SELECT id, username, vai_tro, la_admin, is_active, trang_thai_phe_duyet
-- FROM taikhoan WHERE vai_tro = 'QUAN_LY' ORDER BY id;
