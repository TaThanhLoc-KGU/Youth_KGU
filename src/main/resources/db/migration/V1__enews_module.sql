-- ============================================================
-- Migration: eNews Module — Tin tức & Văn bản
-- File     : V1__enews_module.sql
-- Tác giả  : Claude Code (theo ENEWS_DATABASE.md)
-- Ghi chú  : Project hiện dùng ddl-auto=update (không có Flyway).
--            Chạy file này thủ công qua MySQL client, PhpMyAdmin,
--            hoặc tích hợp Flyway (thêm dependency vào pom.xml).
--
-- Thứ tự tạo bảng (theo quan hệ FK):
--   1. chuyen_muc   (self-ref)
--   2. van_ban       (FK → chuyen_muc)
--   3. tin_tuc       (FK → chuyen_muc, FK → van_ban)
--   4. van_ban_file  (FK → van_ban)
--   5. tin_tuc_anh   (FK → tin_tuc)
--   6. url_redirect  (độc lập)
--   7. SEED chuyen_muc
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- BẢNG 1: chuyen_muc — Danh mục cây (Adjacency List)
-- ============================================================
CREATE TABLE IF NOT EXISTS chuyen_muc (
  id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
  ten             VARCHAR(200)  NOT NULL                    COMMENT 'Tên hiển thị: "Ba chương trình"',
  slug            VARCHAR(200)  NOT NULL UNIQUE             COMMENT 'Slug riêng cấp này: "ba-chuong-trinh"',
  full_path_slug  VARCHAR(1000) NOT NULL UNIQUE             COMMENT 'Full path: "doan-thanh-nien/ba-chuong-trinh"',
  duong_dan       VARCHAR(1000) NOT NULL                    COMMENT 'Path ID dạng "1/2" — dùng LIKE query toàn subtree',
  parent_id       BIGINT        NULL                        COMMENT 'NULL = node gốc; FK tự tham chiếu',
  cap             INT           NOT NULL DEFAULT 1          COMMENT 'Cấp node: 1, 2, 3...',
  mo_ta           VARCHAR(500)  NULL,
  mau_sac         VARCHAR(20)   NULL                        COMMENT 'Mã màu HEX: #0017B0',
  icon            VARCHAR(50)   NULL                        COMMENT 'Tên icon Lucide React',
  to_chuc         ENUM('DOAN','HOI','BAN_DOI_CLB','CHUNG')
                               NULL                         COMMENT 'Filter quyền đăng bài theo đơn vị',
  ban_id          VARCHAR(20)   NULL                        COMMENT 'FK → ban.ma_ban nếu thuộc Ban/Đội/CLB cụ thể',
  thu_tu          INT           NOT NULL DEFAULT 0          COMMENT 'Thứ tự trong cùng cấp cha',
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  is_deleted      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY fk_chuyen_muc_parent (parent_id) REFERENCES chuyen_muc(id) ON DELETE SET NULL,
  FOREIGN KEY fk_chuyen_muc_ban    (ban_id)    REFERENCES ban(ma_ban)     ON DELETE SET NULL,

  INDEX idx_cm_parent_id    (parent_id),
  INDEX idx_cm_duong_dan    (duong_dan(255)),
  INDEX idx_cm_full_path    (full_path_slug(255)),
  INDEX idx_cm_to_chuc      (to_chuc),
  INDEX idx_cm_is_deleted   (is_deleted)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh mục bài viết — cây N cấp dùng Adjacency List';


-- ============================================================
-- BẢNG 2: van_ban — Văn bản / Kế hoạch / Công văn
-- Tạo TRƯỚC tin_tuc vì tin_tuc.van_ban_id FK → van_ban.id
-- ============================================================
CREATE TABLE IF NOT EXISTS van_ban (
  id               BIGINT        AUTO_INCREMENT PRIMARY KEY,
  so_hieu          VARCHAR(100)  NULL                        COMMENT 'Ví dụ: "12/KH-ĐTN", "05/QĐ-HSV"',
  trich_yeu        VARCHAR(1000) NOT NULL                    COMMENT 'Tiêu đề / trích yếu nội dung',
  slug             VARCHAR(500)  NOT NULL UNIQUE             COMMENT 'Slug sinh từ so_hieu + trich_yeu',
  full_url_path    VARCHAR(1000) NOT NULL UNIQUE             COMMENT 'Full path URL: "doan-thanh-nien/ke-hoach/.../slug"',
  loai_van_ban     ENUM(
    'KE_HOACH',
    'CONG_VAN',
    'QUYET_DINH',
    'THONG_BAO',
    'BAO_CAO',
    'HUONG_DAN',
    'BIEN_BAN',
    'TO_TRINH',
    'KHAC'
  )                             NOT NULL                     COMMENT 'Loại văn bản',
  chuyen_muc_id    BIGINT        NULL                        COMMENT 'FK → chuyen_muc.id (nullable)',
  co_quan_ban_hanh VARCHAR(200)  NULL                        COMMENT 'Ví dụ: "Đoàn TN Trường ĐH Kiên Giang"',
  nguoi_ky         VARCHAR(200)  NULL                        COMMENT 'Ví dụ: "Nguyễn Văn A — Bí thư"',
  ngay_ban_hanh    DATE          NULL                        COMMENT 'Ngày ký ban hành chính thức',
  ngay_hieu_luc    DATE          NULL                        COMMENT 'Ngày bắt đầu có hiệu lực',
  ngay_het_han     DATE          NULL                        COMMENT 'NULL = còn hiệu lực vĩnh viễn',
  hoat_dong_id     VARCHAR(50)   NULL                        COMMENT 'FK mềm → hoat_dong.ma_hoat_dong (enforce ở Service)',
  trang_thai       ENUM('DRAFT','PUBLISHED','ARCHIVED')
                                NOT NULL DEFAULT 'DRAFT'     COMMENT 'PUBLISHED = bất biến (VB-001)',
  hieu_luc         ENUM('CON_HIEU_LUC','HET_HIEU_LUC','CHUA_HIEU_LUC')
                                NOT NULL DEFAULT 'CON_HIEU_LUC',
  nguoi_dang       VARCHAR(50)   NOT NULL                    COMMENT 'FK mềm → tai_khoan.username',
  don_vi_dang      VARCHAR(100)  NULL                        COMMENT 'Tên đơn vị đăng bài',
  luot_xem         INT           NOT NULL DEFAULT 0,
  luot_tai         INT           NOT NULL DEFAULT 0,
  is_deleted       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY fk_van_ban_chuyen_muc (chuyen_muc_id) REFERENCES chuyen_muc(id) ON DELETE SET NULL,

  INDEX idx_vb_so_hieu      (so_hieu),
  INDEX idx_vb_loai         (loai_van_ban),
  INDEX idx_vb_trang_thai   (trang_thai),
  INDEX idx_vb_ngay_ban_hanh(ngay_ban_hanh),
  INDEX idx_vb_nguoi_dang   (nguoi_dang),
  INDEX idx_vb_is_deleted   (is_deleted)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Kho văn bản / kế hoạch / công văn — PUBLISHED bất biến';


-- ============================================================
-- BẢNG 3: tin_tuc — Bài đăng tin tức
-- ============================================================
CREATE TABLE IF NOT EXISTS tin_tuc (
  id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
  tieu_de         VARCHAR(500)  NOT NULL                    COMMENT 'Tiêu đề bài viết',
  slug            VARCHAR(500)  NOT NULL                    COMMENT 'Slug sinh từ tiêu đề, max 80 ký tự',
  full_url_path   VARCHAR(1000) NOT NULL UNIQUE             COMMENT 'Full path URL: "cat1/cat2/slug-bai"',
  tom_tat         TEXT          NULL                        COMMENT 'Tóm tắt ≤ 300 ký tự, dùng cho SEO description',
  noi_dung        LONGTEXT      NULL                        COMMENT 'Nội dung HTML từ rich text editor',
  anh_dai_dien    VARCHAR(500)  NULL                        COMMENT 'URL ảnh thumbnail / đại diện',
  chuyen_muc_id   BIGINT        NOT NULL                    COMMENT 'FK → chuyen_muc.id (bắt buộc)',
  van_ban_id      BIGINT        NULL                        COMMENT 'FK → van_ban.id (liên kết tùy chọn)',
  hoat_dong_id    VARCHAR(50)   NULL                        COMMENT 'FK mềm → hoat_dong.ma_hoat_dong (enforce ở Service, TT-001)',
  trang_thai      ENUM('DRAFT','PUBLISHED','ARCHIVED')
                               NOT NULL DEFAULT 'DRAFT',
  is_ghim         TINYINT(1)    NOT NULL DEFAULT 0          COMMENT 'Ghim lên đầu trang chủ',
  nguoi_tao       VARCHAR(50)   NOT NULL                    COMMENT 'FK mềm → tai_khoan.username',
  don_vi_dang     VARCHAR(100)  NULL                        COMMENT 'Tên đơn vị đăng: "Đoàn TN Trường ĐH Kiên Giang"',
  luot_xem        INT           NOT NULL DEFAULT 0,
  ngay_xuat_ban   DATETIME      NULL                        COMMENT 'Tự set = NOW() khi trang_thai → PUBLISHED (TT-002)',
  is_deleted      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY fk_tin_tuc_chuyen_muc (chuyen_muc_id) REFERENCES chuyen_muc(id),
  FOREIGN KEY fk_tin_tuc_van_ban    (van_ban_id)    REFERENCES van_ban(id) ON DELETE SET NULL,

  INDEX idx_tt_chuyen_muc   (chuyen_muc_id),
  INDEX idx_tt_trang_thai   (trang_thai),
  INDEX idx_tt_nguoi_tao    (nguoi_tao),
  INDEX idx_tt_ngay_xb      (ngay_xuat_ban),
  INDEX idx_tt_is_ghim      (is_ghim),
  INDEX idx_tt_is_deleted   (is_deleted),
  INDEX idx_tt_full_url     (full_url_path(255))

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bài đăng tin tức eNews';


-- ============================================================
-- BẢNG 4: van_ban_file — File đính kèm của văn bản
-- Quy tắc: mỗi van_ban chỉ có đúng 1 bản ghi (VB-002)
--          Chỉ được thay thế khi van_ban.trang_thai = DRAFT
-- ============================================================
CREATE TABLE IF NOT EXISTS van_ban_file (
  id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
  van_ban_id      BIGINT        NOT NULL                    COMMENT 'FK → van_ban.id',
  ten_file_goc    VARCHAR(500)  NOT NULL                    COMMENT 'Tên file gốc khi upload: "ke-hoach.pdf"',
  ten_hien_thi    VARCHAR(500)  NULL                        COMMENT 'Tên hiển thị đẹp: "Kế hoạch TNTN 2025.pdf"',
  duong_dan       VARCHAR(1000) NOT NULL                    COMMENT 'Path lưu: /uploads/van-ban/2025/03/{uuid}.pdf',
  loai_file       VARCHAR(20)   NOT NULL                    COMMENT 'pdf | docx | xlsx | pptx',
  kich_thuoc      BIGINT        NOT NULL                    COMMENT 'Kích thước bytes',
  nguoi_upload    VARCHAR(50)   NOT NULL                    COMMENT 'FK mềm → tai_khoan.username',
  ngay_upload     DATETIME      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY fk_vb_file_van_ban (van_ban_id) REFERENCES van_ban(id) ON DELETE CASCADE,

  INDEX idx_vbf_van_ban_id (van_ban_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='File đính kèm của văn bản — đúng 1 file / 1 van_ban';


-- ============================================================
-- BẢNG 5: tin_tuc_anh — Gallery ảnh của bài viết (optional)
-- ============================================================
CREATE TABLE IF NOT EXISTS tin_tuc_anh (
  id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
  tin_tuc_id      BIGINT        NOT NULL                    COMMENT 'FK → tin_tuc.id',
  duong_dan       VARCHAR(1000) NOT NULL                    COMMENT 'Path ảnh lưu trữ',
  ten_file_goc    VARCHAR(500)  NULL                        COMMENT 'Tên file gốc khi upload',
  mo_ta           VARCHAR(500)  NULL                        COMMENT 'Alt text cho ảnh (SEO)',
  thu_tu          INT           NOT NULL DEFAULT 0          COMMENT 'Thứ tự trong gallery',
  ngay_upload     DATETIME      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY fk_tt_anh_tin_tuc (tin_tuc_id) REFERENCES tin_tuc(id) ON DELETE CASCADE,

  INDEX idx_tta_tin_tuc_id (tin_tuc_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ảnh gallery của bài tin tức';


-- ============================================================
-- BẢNG 6: url_redirect — 301/302 Redirect khi đổi slug
-- Tự động tạo bởi Service khi đổi ten của chuyen_muc (CM-001)
-- ============================================================
CREATE TABLE IF NOT EXISTS url_redirect (
  id          BIGINT        AUTO_INCREMENT PRIMARY KEY,
  url_cu      VARCHAR(1000) NOT NULL                        COMMENT 'Path cũ, không có dấu / đầu',
  url_moi     VARCHAR(1000) NOT NULL                        COMMENT 'Path mới, không có dấu / đầu',
  kieu        INT           NOT NULL DEFAULT 301            COMMENT '301 = permanent | 302 = temporary',
  ly_do       VARCHAR(500)  NULL                            COMMENT 'Ghi chú lý do redirect',
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_url_redirect_cu (url_cu(500))

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lưu redirect khi đổi tên danh mục làm thay đổi full_path_slug';


SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- SEED DATA: Danh mục mặc định (chuyen_muc)
-- ============================================================

-- Cấp 1 — 4 node gốc
INSERT INTO chuyen_muc
  (id, ten, slug, full_path_slug, duong_dan, parent_id, cap, to_chuc, mau_sac, icon, thu_tu, is_active, is_deleted)
VALUES
  (1, 'Đoàn Thanh Niên', 'doan-thanh-nien', 'doan-thanh-nien', '1', NULL, 1, 'DOAN',        '#0017B0', 'Star',   1, 1, 0),
  (2, 'Hội Sinh Viên',   'hoi-sinh-vien',   'hoi-sinh-vien',   '2', NULL, 1, 'HOI',         '#059669', 'Users',  2, 1, 0),
  (3, 'Ban - Đội - CLB', 'ban-doi-clb',     'ban-doi-clb',     '3', NULL, 1, 'BAN_DOI_CLB', '#7C3AED', 'Shield', 3, 1, 0),
  (4, 'Thông báo chung', 'thong-bao-chung', 'thong-bao-chung', '4', NULL, 1, 'CHUNG',       '#DC2626', 'Bell',   4, 1, 0);

-- Cấp 2 — Con của "Đoàn Thanh Niên" (parent_id = 1)
INSERT INTO chuyen_muc
  (id, ten, slug, full_path_slug, duong_dan, parent_id, cap, to_chuc, thu_tu, is_active, is_deleted)
VALUES
  (10, 'Tin tức - Sự kiện',        'tin-tuc-su-kien',       'doan-thanh-nien/tin-tuc-su-kien',       '1/10', 1, 2, 'DOAN', 1, 1, 0),
  (11, 'Ba chương trình',          'ba-chuong-trinh',       'doan-thanh-nien/ba-chuong-trinh',       '1/11', 1, 2, 'DOAN', 2, 1, 0),
  (12, 'Ba phong trào',            'ba-phong-trao',         'doan-thanh-nien/ba-phong-trao',         '1/12', 1, 2, 'DOAN', 3, 1, 0),
  (13, 'Công tác giáo dục',        'cong-tac-giao-duc',     'doan-thanh-nien/cong-tac-giao-duc',     '1/13', 1, 2, 'DOAN', 4, 1, 0),
  (14, 'Hội nhập quốc tế',         'hoi-nhap-quoc-te',      'doan-thanh-nien/hoi-nhap-quoc-te',      '1/14', 1, 2, 'DOAN', 5, 1, 0),
  (15, 'Xây dựng Đoàn',            'xay-dung-doan',         'doan-thanh-nien/xay-dung-doan',         '1/15', 1, 2, 'DOAN', 6, 1, 0),
  (16, 'Kế hoạch - Văn bản Đoàn', 'ke-hoach-van-ban-doan', 'doan-thanh-nien/ke-hoach-van-ban-doan', '1/16', 1, 2, 'DOAN', 7, 1, 0);

-- Cấp 3 — Con của "Ba chương trình" (parent_id = 11)
INSERT INTO chuyen_muc
  (id, ten, slug, full_path_slug, duong_dan, parent_id, cap, to_chuc, thu_tu, is_active, is_deleted)
VALUES
  (20, 'Thanh niên tình nguyện', 'thanh-nien-tinh-nguyen', 'doan-thanh-nien/ba-chuong-trinh/thanh-nien-tinh-nguyen', '1/11/20', 11, 3, 'DOAN', 1, 1, 0),
  (21, 'Tuổi trẻ sáng tạo',     'tuoi-tre-sang-tao',      'doan-thanh-nien/ba-chuong-trinh/tuoi-tre-sang-tao',      '1/11/21', 11, 3, 'DOAN', 2, 1, 0),
  (22, 'Tuổi trẻ xung kích',    'tuoi-tre-xung-kich',     'doan-thanh-nien/ba-chuong-trinh/tuoi-tre-xung-kich',     '1/11/22', 11, 3, 'DOAN', 3, 1, 0);

-- Cấp 2 — Con của "Hội Sinh Viên" (parent_id = 2)
INSERT INTO chuyen_muc
  (id, ten, slug, full_path_slug, duong_dan, parent_id, cap, to_chuc, thu_tu, is_active, is_deleted)
VALUES
  (30, 'Tin tức - Sự kiện Hội',   'tin-tuc-su-kien-hoi',  'hoi-sinh-vien/tin-tuc-su-kien-hoi',  '2/30', 2, 2, 'HOI', 1, 1, 0),
  (31, 'Kế hoạch - Văn bản Hội', 'ke-hoach-van-ban-hoi', 'hoi-sinh-vien/ke-hoach-van-ban-hoi', '2/31', 2, 2, 'HOI', 2, 1, 0),
  (32, 'Hỗ trợ sinh viên',       'ho-tro-sinh-vien',     'hoi-sinh-vien/ho-tro-sinh-vien',     '2/32', 2, 2, 'HOI', 3, 1, 0),
  (33, 'Thông báo Hội',          'thong-bao-hoi',        'hoi-sinh-vien/thong-bao-hoi',        '2/33', 2, 2, 'HOI', 4, 1, 0);
