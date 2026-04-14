-- ============================================================
-- V4: Refactor hệ thống phân quyền
-- Mục tiêu:
--   1. Thêm cột la_admin vào taikhoan
--   2. Tạo bảng tai_khoan_quyen (gán quyền trực tiếp)
--   3. Migrate data: ADMIN → la_admin=true; BCH/GV/CV → QUAN_LY
--   4. Di chuyển effective permissions vào tai_khoan_quyen
--   5. Xóa cột bch_level
-- ============================================================

-- ── Step 1: Thêm cột la_admin ──────────────────────────────
ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS la_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Step 2: Tạo bảng tai_khoan_quyen ──────────────────────
CREATE TABLE IF NOT EXISTS tai_khoan_quyen (
    tai_khoan_id BIGINT NOT NULL,
    quyen_id     BIGINT NOT NULL,
    created_at   DATETIME(6) DEFAULT NULL,
    created_by   BIGINT      DEFAULT NULL,
    PRIMARY KEY (tai_khoan_id, quyen_id),
    CONSTRAINT fk_tkq_taikhoan FOREIGN KEY (tai_khoan_id) REFERENCES taikhoan (id) ON DELETE CASCADE,
    CONSTRAINT fk_tkq_quyen    FOREIGN KEY (quyen_id)     REFERENCES permissions (id) ON DELETE CASCADE
);

-- ── Step 3a: Đánh dấu admin ────────────────────────────────
UPDATE taikhoan SET la_admin = TRUE WHERE vai_tro = 'ADMIN';

-- ── Step 3b: Migrate quyền cơ bản cho QUAN_LY users (từ role_permissions) ──
-- BCH_LEVEL_1/2/3 based on bch_level
INSERT IGNORE INTO tai_khoan_quyen (tai_khoan_id, quyen_id, created_at)
SELECT DISTINCT t.id, rp.permission_id, NOW()
FROM taikhoan t
JOIN role_permissions rp ON (
       (t.vai_tro = 'BCH'         AND rp.role_name = CONCAT('BCH_LEVEL_', COALESCE(t.bch_level, 3)))
    OR (t.vai_tro = 'GIANG_VIEN'  AND rp.role_name = 'GIANG_VIEN')
    OR (t.vai_tro = 'CHUYEN_VIEN' AND rp.role_name = 'CHUYEN_VIEN')
    OR (t.vai_tro = 'MANAGER'     AND rp.role_name = 'MANAGER')
    OR (t.vai_tro = 'STAFF'       AND rp.role_name = 'STAFF')
)
WHERE t.vai_tro NOT IN ('ADMIN', 'SINH_VIEN')
  -- Bỏ qua các quyền đã bị thu hồi cụ thể cho user
  AND NOT EXISTS (
      SELECT 1 FROM account_permissions ap
      WHERE ap.tai_khoan_id = t.id
        AND ap.permission_id = rp.permission_id
        AND ap.is_granted = FALSE
  );

-- ── Step 3c: Thêm các quyền đặc biệt được grant thêm (account_permissions override) ──
INSERT IGNORE INTO tai_khoan_quyen (tai_khoan_id, quyen_id, created_at)
SELECT ap.tai_khoan_id, ap.permission_id, NOW()
FROM account_permissions ap
JOIN taikhoan t ON t.id = ap.tai_khoan_id
WHERE ap.is_granted = TRUE
  AND t.vai_tro NOT IN ('ADMIN', 'SINH_VIEN');

-- ── Step 4: Cập nhật vai_tro về 2 loại mới ─────────────────
UPDATE taikhoan SET vai_tro = 'QUAN_LY'
WHERE vai_tro IN ('BCH', 'GIANG_VIEN', 'CHUYEN_VIEN', 'MANAGER', 'STAFF', 'ADMIN');

-- ── Step 5: Xóa cột bch_level ──────────────────────────────
ALTER TABLE taikhoan DROP COLUMN IF EXISTS bch_level;
