-- =============================================================
-- V_permissions_cleanup.sql
-- Migration: Chuẩn hóa toàn bộ permissions cho hệ thống Youth_KGU
-- Cấu trúc bảng:
--   permissions     (id BIGINT AI PK, category VARCHAR, name VARCHAR, description VARCHAR)
--   role_permissions(role_name VARCHAR, permission_id BIGINT FK → permissions.id)
--   account_permissions(id BIGINT AI PK, tai_khoan_id BIGINT FK, permission_id BIGINT FK, ...)
-- =============================================================

START TRANSACTION;

-- ============================================================
-- PHẦN 1: XÓA DỮ LIỆU CŨ (theo đúng thứ tự FK để tránh lỗi)
-- ============================================================

DELETE FROM account_permissions;
DELETE FROM role_permissions;
DELETE FROM permissions;
ALTER TABLE permissions AUTO_INCREMENT = 1;

-- ============================================================
-- PHẦN 2: INSERT PERMISSIONS CHUẨN (tiếng Việt, không trùng)
-- Tổng: 58 permissions, ID cố định 1-58
-- ============================================================

INSERT INTO permissions (id, category, name, description) VALUES

-- ─── HE_THONG (id 1-4) ────────────────────────────────────────
(1,  'HE_THONG',    'DOI_MAT_KHAU',                     'Đổi mật khẩu'),
(2,  'HE_THONG',    'XEM_THONG_TIN_CA_NHAN',            'Xem thông tin cá nhân'),
(3,  'HE_THONG',    'SUA_THONG_TIN_CA_NHAN',            'Sửa thông tin cá nhân'),
(4,  'HE_THONG',    'CAI_DAT_HE_THONG',                 'Cài đặt hệ thống'),

-- ─── SINH_VIEN (id 5-9) ───────────────────────────────────────
(5,  'SINH_VIEN',   'XEM_SINH_VIEN',                    'Xem danh sách sinh viên'),
(6,  'SINH_VIEN',   'THEM_SINH_VIEN',                   'Thêm sinh viên'),
(7,  'SINH_VIEN',   'SUA_SINH_VIEN',                    'Sửa sinh viên'),
(8,  'SINH_VIEN',   'XOA_SINH_VIEN',                    'Xóa sinh viên'),
(9,  'SINH_VIEN',   'IMPORT_SINH_VIEN',                 'Import sinh viên từ Excel'),

-- ─── GIANG_VIEN (id 10-13) ────────────────────────────────────
(10, 'GIANG_VIEN',  'XEM_GIANG_VIEN',                   'Xem danh sách giảng viên'),
(11, 'GIANG_VIEN',  'THEM_GIANG_VIEN',                  'Thêm giảng viên'),
(12, 'GIANG_VIEN',  'SUA_GIANG_VIEN',                   'Sửa giảng viên'),
(13, 'GIANG_VIEN',  'XOA_GIANG_VIEN',                   'Xóa giảng viên'),

-- ─── CHUYEN_VIEN (id 14-15) ───────────────────────────────────
(14, 'CHUYEN_VIEN', 'XEM_CHUYEN_VIEN',                  'Xem danh sách chuyên viên'),
(15, 'CHUYEN_VIEN', 'QUAN_LY_CHUYEN_VIEN',              'Quản lý chuyên viên'),

-- ─── TO_CHUC (id 16-27) ───────────────────────────────────────
(16, 'TO_CHUC',     'XEM_KHOA',                         'Xem danh sách khoa'),
(17, 'TO_CHUC',     'QUAN_LY_KHOA',                     'Quản lý khoa (thêm/sửa/xóa)'),
(18, 'TO_CHUC',     'XEM_NGANH',                        'Xem danh sách ngành'),
(19, 'TO_CHUC',     'QUAN_LY_NGANH',                    'Quản lý ngành'),
(20, 'TO_CHUC',     'XEM_LOP',                          'Xem danh sách lớp'),
(21, 'TO_CHUC',     'QUAN_LY_LOP',                      'Quản lý lớp'),
(22, 'TO_CHUC',     'XEM_KHOA_HOC',                     'Xem khóa học'),
(23, 'TO_CHUC',     'QUAN_LY_KHOA_HOC',                 'Quản lý khóa học'),
(24, 'TO_CHUC',     'XEM_HOC_KY',                       'Xem học kỳ'),
(25, 'TO_CHUC',     'QUAN_LY_HOC_KY',                   'Quản lý học kỳ'),
(26, 'TO_CHUC',     'XEM_NAM_HOC',                      'Xem năm học'),
(27, 'TO_CHUC',     'QUAN_LY_NAM_HOC',                  'Quản lý năm học'),

-- ─── HOAT_DONG (id 28-36) ─────────────────────────────────────
(28, 'HOAT_DONG',   'XEM_HOAT_DONG',                    'Xem hoạt động'),
(29, 'HOAT_DONG',   'TAO_HOAT_DONG',                    'Tạo hoạt động'),
(30, 'HOAT_DONG',   'SUA_HOAT_DONG',                    'Sửa hoạt động'),
(31, 'HOAT_DONG',   'XOA_HOAT_DONG',                    'Xóa hoạt động'),
(32, 'HOAT_DONG',   'DUYET_HOAT_DONG',                  'Duyệt hoạt động'),
(33, 'HOAT_DONG',   'DANG_KY_HOAT_DONG',                'Đăng ký tham gia hoạt động'),
(34, 'HOAT_DONG',   'HUY_DANG_KY_HOAT_DONG',           'Hủy đăng ký hoạt động'),
(35, 'HOAT_DONG',   'XEM_LICH_SU_THAM_GIA',            'Xem lịch sử tham gia'),
(36, 'HOAT_DONG',   'QUAN_LY_DANG_KY',                  'Quản lý đăng ký hoạt động'),

-- ─── DIEM_DANH (id 37-40) ─────────────────────────────────────
(37, 'DIEM_DANH',   'QUET_QR',                          'Quét mã QR điểm danh'),
(38, 'DIEM_DANH',   'PHAN_CONG_DIEM_DANH',              'Phân công người điểm danh'),
(39, 'DIEM_DANH',   'XEM_DIEM_DANH',                    'Xem báo cáo điểm danh'),
(40, 'DIEM_DANH',   'CHINH_SUA_DIEM_DANH',              'Chỉnh sửa điểm danh thủ công'),

-- ─── BCH (id 41-46) ───────────────────────────────────────────
(41, 'BCH',         'XEM_BCH',                          'Xem danh sách BCH'),
(42, 'BCH',         'THEM_BCH',                         'Thêm thành viên BCH'),
(43, 'BCH',         'SUA_BCH',                          'Sửa thông tin BCH'),
(44, 'BCH',         'XOA_BCH',                          'Xóa thành viên BCH'),
(45, 'BCH',         'QUAN_LY_CHUC_VU',                  'Quản lý chức vụ'),
(46, 'BCH',         'QUAN_LY_BAN',                      'Quản lý ban'),

-- ─── TAI_KHOAN (id 47-51) ─────────────────────────────────────
(47, 'TAI_KHOAN',   'XEM_TAI_KHOAN',                    'Xem danh sách tài khoản'),
(48, 'TAI_KHOAN',   'DUYET_TAI_KHOAN',                  'Duyệt tài khoản đăng ký'),
(49, 'TAI_KHOAN',   'TAO_TAI_KHOAN',                    'Tạo tài khoản mới'),
(50, 'TAI_KHOAN',   'SUA_TAI_KHOAN',                    'Sửa thông tin tài khoản'),
(51, 'TAI_KHOAN',   'XOA_TAI_KHOAN',                    'Xóa tài khoản'),

-- ─── PHAN_QUYEN (id 52-53) ────────────────────────────────────
(52, 'PHAN_QUYEN',  'QUAN_LY_PHAN_QUYEN_NHOM',          'Quản lý quyền theo nhóm/chức vụ'),
(53, 'PHAN_QUYEN',  'QUAN_LY_PHAN_QUYEN_TAI_KHOAN',     'Phân quyền riêng cho tài khoản'),

-- ─── BAO_CAO (id 54-56) ───────────────────────────────────────
(54, 'BAO_CAO',     'XEM_BAO_CAO',                      'Xem báo cáo thống kê'),
(55, 'BAO_CAO',     'XUAT_BAO_CAO',                     'Xuất báo cáo (Excel/PDF)'),
(56, 'BAO_CAO',     'XEM_THONG_KE',                     'Xem thống kê tổng quan'),

-- ─── SYSTEM (id 57-58) ────────────────────────────────────────
(57, 'SYSTEM',      'XEM_SYSTEM_LOG',                   'Xem system log'),
(58, 'SYSTEM',      'XUAT_SYSTEM_LOG',                  'Xuất system log');

-- ============================================================
-- PHẦN 3: INSERT ROLE_PERMISSIONS
-- Cấu trúc: (role_name VARCHAR, permission_id BIGINT)
-- Role names: ADMIN | SINH_VIEN | GIANG_VIEN | GIANG_VIEN_HUONG_DAN
--             CHUYEN_VIEN | CV001..CV011
-- ============================================================

-- ─── ADMIN → tất cả 58 quyền ──────────────────────────────────
INSERT INTO role_permissions (role_name, permission_id) VALUES
('ADMIN', 1),  ('ADMIN', 2),  ('ADMIN', 3),  ('ADMIN', 4),  ('ADMIN', 5),
('ADMIN', 6),  ('ADMIN', 7),  ('ADMIN', 8),  ('ADMIN', 9),  ('ADMIN', 10),
('ADMIN', 11), ('ADMIN', 12), ('ADMIN', 13), ('ADMIN', 14), ('ADMIN', 15),
('ADMIN', 16), ('ADMIN', 17), ('ADMIN', 18), ('ADMIN', 19), ('ADMIN', 20),
('ADMIN', 21), ('ADMIN', 22), ('ADMIN', 23), ('ADMIN', 24), ('ADMIN', 25),
('ADMIN', 26), ('ADMIN', 27), ('ADMIN', 28), ('ADMIN', 29), ('ADMIN', 30),
('ADMIN', 31), ('ADMIN', 32), ('ADMIN', 33), ('ADMIN', 34), ('ADMIN', 35),
('ADMIN', 36), ('ADMIN', 37), ('ADMIN', 38), ('ADMIN', 39), ('ADMIN', 40),
('ADMIN', 41), ('ADMIN', 42), ('ADMIN', 43), ('ADMIN', 44), ('ADMIN', 45),
('ADMIN', 46), ('ADMIN', 47), ('ADMIN', 48), ('ADMIN', 49), ('ADMIN', 50),
('ADMIN', 51), ('ADMIN', 52), ('ADMIN', 53), ('ADMIN', 54), ('ADMIN', 55),
('ADMIN', 56), ('ADMIN', 57), ('ADMIN', 58);

-- ─── SINH_VIEN → đổi mật khẩu, xem/sửa hồ sơ, xem+đăng ký hoạt động ─
INSERT INTO role_permissions (role_name, permission_id) VALUES
('SINH_VIEN', 1),  -- DOI_MAT_KHAU
('SINH_VIEN', 2),  -- XEM_THONG_TIN_CA_NHAN
('SINH_VIEN', 3),  -- SUA_THONG_TIN_CA_NHAN
('SINH_VIEN', 28), -- XEM_HOAT_DONG
('SINH_VIEN', 33), -- DANG_KY_HOAT_DONG
('SINH_VIEN', 34), -- HUY_DANG_KY_HOAT_DONG
('SINH_VIEN', 35); -- XEM_LICH_SU_THAM_GIA

-- ─── GIANG_VIEN → hồ sơ, xem sv+gv, xem hoạt động, xem điểm danh ────
INSERT INTO role_permissions (role_name, permission_id) VALUES
('GIANG_VIEN', 1),  -- DOI_MAT_KHAU
('GIANG_VIEN', 2),  -- XEM_THONG_TIN_CA_NHAN
('GIANG_VIEN', 3),  -- SUA_THONG_TIN_CA_NHAN
('GIANG_VIEN', 5),  -- XEM_SINH_VIEN
('GIANG_VIEN', 10), -- XEM_GIANG_VIEN
('GIANG_VIEN', 28), -- XEM_HOAT_DONG
('GIANG_VIEN', 35), -- XEM_LICH_SU_THAM_GIA
('GIANG_VIEN', 39); -- XEM_DIEM_DANH

-- ─── GIANG_VIEN_HUONG_DAN → như GV + chỉnh sửa điểm danh ─────────────
INSERT INTO role_permissions (role_name, permission_id) VALUES
('GIANG_VIEN_HUONG_DAN', 1),  -- DOI_MAT_KHAU
('GIANG_VIEN_HUONG_DAN', 2),  -- XEM_THONG_TIN_CA_NHAN
('GIANG_VIEN_HUONG_DAN', 3),  -- SUA_THONG_TIN_CA_NHAN
('GIANG_VIEN_HUONG_DAN', 5),  -- XEM_SINH_VIEN
('GIANG_VIEN_HUONG_DAN', 10), -- XEM_GIANG_VIEN
('GIANG_VIEN_HUONG_DAN', 28), -- XEM_HOAT_DONG
('GIANG_VIEN_HUONG_DAN', 35), -- XEM_LICH_SU_THAM_GIA
('GIANG_VIEN_HUONG_DAN', 39), -- XEM_DIEM_DANH
('GIANG_VIEN_HUONG_DAN', 40); -- CHINH_SUA_DIEM_DANH

-- ─── CHUYEN_VIEN → hồ sơ, xem sv+gv, hoạt động, điểm danh, báo cáo ──
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CHUYEN_VIEN', 1),  -- DOI_MAT_KHAU
('CHUYEN_VIEN', 2),  -- XEM_THONG_TIN_CA_NHAN
('CHUYEN_VIEN', 3),  -- SUA_THONG_TIN_CA_NHAN
('CHUYEN_VIEN', 5),  -- XEM_SINH_VIEN
('CHUYEN_VIEN', 10), -- XEM_GIANG_VIEN
('CHUYEN_VIEN', 28), -- XEM_HOAT_DONG
('CHUYEN_VIEN', 39), -- XEM_DIEM_DANH
('CHUYEN_VIEN', 54), -- XEM_BAO_CAO
('CHUYEN_VIEN', 56); -- XEM_THONG_KE

-- ─── CV001 (Bí thư Đoàn) → toàn quyền ────────────────────────────────
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV001', 1),  ('CV001', 2),  ('CV001', 3),  ('CV001', 4),  ('CV001', 5),
('CV001', 6),  ('CV001', 7),  ('CV001', 8),  ('CV001', 9),  ('CV001', 10),
('CV001', 11), ('CV001', 12), ('CV001', 13), ('CV001', 14), ('CV001', 15),
('CV001', 16), ('CV001', 17), ('CV001', 18), ('CV001', 19), ('CV001', 20),
('CV001', 21), ('CV001', 22), ('CV001', 23), ('CV001', 24), ('CV001', 25),
('CV001', 26), ('CV001', 27), ('CV001', 28), ('CV001', 29), ('CV001', 30),
('CV001', 31), ('CV001', 32), ('CV001', 33), ('CV001', 34), ('CV001', 35),
('CV001', 36), ('CV001', 37), ('CV001', 38), ('CV001', 39), ('CV001', 40),
('CV001', 41), ('CV001', 42), ('CV001', 43), ('CV001', 44), ('CV001', 45),
('CV001', 46), ('CV001', 47), ('CV001', 48), ('CV001', 49), ('CV001', 50),
('CV001', 51), ('CV001', 52), ('CV001', 53), ('CV001', 54), ('CV001', 55),
('CV001', 56), ('CV001', 57), ('CV001', 58);

-- ─── CV002 (Phó Bí thư) → toàn quyền trừ: 51,52,53,57,58 ────────────
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV002', 1),  ('CV002', 2),  ('CV002', 3),  ('CV002', 4),  ('CV002', 5),
('CV002', 6),  ('CV002', 7),  ('CV002', 8),  ('CV002', 9),  ('CV002', 10),
('CV002', 11), ('CV002', 12), ('CV002', 13), ('CV002', 14), ('CV002', 15),
('CV002', 16), ('CV002', 17), ('CV002', 18), ('CV002', 19), ('CV002', 20),
('CV002', 21), ('CV002', 22), ('CV002', 23), ('CV002', 24), ('CV002', 25),
('CV002', 26), ('CV002', 27), ('CV002', 28), ('CV002', 29), ('CV002', 30),
('CV002', 31), ('CV002', 32), ('CV002', 33), ('CV002', 34), ('CV002', 35),
('CV002', 36), ('CV002', 37), ('CV002', 38), ('CV002', 39), ('CV002', 40),
('CV002', 41), ('CV002', 42), ('CV002', 43), ('CV002', 44), ('CV002', 45),
('CV002', 46), ('CV002', 47), ('CV002', 48), ('CV002', 49), ('CV002', 50),
-- bỏ 51 (XOA_TAI_KHOAN), 52 (QL_PHAN_QUYEN_NHOM), 53 (QL_PHAN_QUYEN_TK)
('CV002', 54), ('CV002', 55), ('CV002', 56);
-- bỏ 57 (XEM_SYSTEM_LOG), 58 (XUAT_SYSTEM_LOG)

-- ─── CV003 (Trưởng Ban Truyền thông) ──────────────────────────────────
-- 1,2,3,4, 5,20, 28,29,30,32,36, 37,38,39, 41,47,48, 54,56
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV003', 1),  ('CV003', 2),  ('CV003', 3),  ('CV003', 4),
('CV003', 5),  ('CV003', 20),
('CV003', 28), ('CV003', 29), ('CV003', 30), ('CV003', 32), ('CV003', 36),
('CV003', 37), ('CV003', 38), ('CV003', 39),
('CV003', 41), ('CV003', 47), ('CV003', 48),
('CV003', 54), ('CV003', 56);

-- ─── CV004 (Trưởng Ban Tổ chức) → giống CV003 ─────────────────────────
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV004', 1),  ('CV004', 2),  ('CV004', 3),  ('CV004', 4),
('CV004', 5),  ('CV004', 20),
('CV004', 28), ('CV004', 29), ('CV004', 30), ('CV004', 32), ('CV004', 36),
('CV004', 37), ('CV004', 38), ('CV004', 39),
('CV004', 41), ('CV004', 47), ('CV004', 48),
('CV004', 54), ('CV004', 56);

-- ─── CV005 (Chủ tịch Hội Sinh viên) → toàn quyền ─────────────────────
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV005', 1),  ('CV005', 2),  ('CV005', 3),  ('CV005', 4),  ('CV005', 5),
('CV005', 6),  ('CV005', 7),  ('CV005', 8),  ('CV005', 9),  ('CV005', 10),
('CV005', 11), ('CV005', 12), ('CV005', 13), ('CV005', 14), ('CV005', 15),
('CV005', 16), ('CV005', 17), ('CV005', 18), ('CV005', 19), ('CV005', 20),
('CV005', 21), ('CV005', 22), ('CV005', 23), ('CV005', 24), ('CV005', 25),
('CV005', 26), ('CV005', 27), ('CV005', 28), ('CV005', 29), ('CV005', 30),
('CV005', 31), ('CV005', 32), ('CV005', 33), ('CV005', 34), ('CV005', 35),
('CV005', 36), ('CV005', 37), ('CV005', 38), ('CV005', 39), ('CV005', 40),
('CV005', 41), ('CV005', 42), ('CV005', 43), ('CV005', 44), ('CV005', 45),
('CV005', 46), ('CV005', 47), ('CV005', 48), ('CV005', 49), ('CV005', 50),
('CV005', 51), ('CV005', 52), ('CV005', 53), ('CV005', 54), ('CV005', 55),
('CV005', 56), ('CV005', 57), ('CV005', 58);

-- ─── CV006 (Phó Chủ tịch HSV) → giống CV002 ──────────────────────────
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV006', 1),  ('CV006', 2),  ('CV006', 3),  ('CV006', 4),  ('CV006', 5),
('CV006', 6),  ('CV006', 7),  ('CV006', 8),  ('CV006', 9),  ('CV006', 10),
('CV006', 11), ('CV006', 12), ('CV006', 13), ('CV006', 14), ('CV006', 15),
('CV006', 16), ('CV006', 17), ('CV006', 18), ('CV006', 19), ('CV006', 20),
('CV006', 21), ('CV006', 22), ('CV006', 23), ('CV006', 24), ('CV006', 25),
('CV006', 26), ('CV006', 27), ('CV006', 28), ('CV006', 29), ('CV006', 30),
('CV006', 31), ('CV006', 32), ('CV006', 33), ('CV006', 34), ('CV006', 35),
('CV006', 36), ('CV006', 37), ('CV006', 38), ('CV006', 39), ('CV006', 40),
('CV006', 41), ('CV006', 42), ('CV006', 43), ('CV006', 44), ('CV006', 45),
('CV006', 46), ('CV006', 47), ('CV006', 48), ('CV006', 49), ('CV006', 50),
('CV006', 54), ('CV006', 55), ('CV006', 56);

-- ─── CV007 (Tổng thư ký Hội) ──────────────────────────────────────────
-- 1,2,3, 5,20, 28,35,39, 41,47, 54,55,56
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV007', 1),  ('CV007', 2),  ('CV007', 3),
('CV007', 5),  ('CV007', 20),
('CV007', 28), ('CV007', 35), ('CV007', 39),
('CV007', 41), ('CV007', 47),
('CV007', 54), ('CV007', 55), ('CV007', 56);

-- ─── CV008 (Trưởng Đội Tình nguyện) → giống CV007 ─────────────────────
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV008', 1),  ('CV008', 2),  ('CV008', 3),
('CV008', 5),  ('CV008', 20),
('CV008', 28), ('CV008', 35), ('CV008', 39),
('CV008', 41), ('CV008', 47),
('CV008', 54), ('CV008', 55), ('CV008', 56);

-- ─── CV009 (Thành viên Đội Tình nguyện) ──────────────────────────────
-- 1,2,3, 5,20, 28,29,30,36, 37,39, 41,54
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV009', 1),  ('CV009', 2),  ('CV009', 3),
('CV009', 5),  ('CV009', 20),
('CV009', 28), ('CV009', 29), ('CV009', 30), ('CV009', 36),
('CV009', 37), ('CV009', 39),
('CV009', 41), ('CV009', 54);

-- ─── CV010 (Chủ tịch CLB) ─────────────────────────────────────────────
-- 1,2,3, 5,20, 28,36, 37,39, 41,54
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV010', 1),  ('CV010', 2),  ('CV010', 3),
('CV010', 5),  ('CV010', 20),
('CV010', 28), ('CV010', 36),
('CV010', 37), ('CV010', 39),
('CV010', 41), ('CV010', 54);

-- ─── CV011 (Thành viên CLB) ───────────────────────────────────────────
-- 1,2,3, 28,37,39
INSERT INTO role_permissions (role_name, permission_id) VALUES
('CV011', 1),  -- DOI_MAT_KHAU
('CV011', 2),  -- XEM_THONG_TIN_CA_NHAN
('CV011', 3),  -- SUA_THONG_TIN_CA_NHAN
('CV011', 28), -- XEM_HOAT_DONG
('CV011', 37), -- QUET_QR
('CV011', 39); -- XEM_DIEM_DANH

COMMIT;

-- ============================================================
-- VERIFY: Kiểm tra số lượng records sau khi insert
-- ============================================================

SELECT 'permissions'     AS tabel, COUNT(*) AS so_luong FROM permissions
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'account_permissions', COUNT(*) FROM account_permissions;

-- Chi tiết permissions theo category
SELECT category, COUNT(*) AS so_quyen
FROM permissions
GROUP BY category
ORDER BY category;

-- Chi tiết role_permissions theo role
SELECT role_name, COUNT(*) AS so_quyen
FROM role_permissions
GROUP BY role_name
ORDER BY role_name;
