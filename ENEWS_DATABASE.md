# eNews — Database Schema (Migration)

> **Claude Code:** Tạo file migration mới trong `src/main/resources/db/migration/`
> Tên file: `V{next_version}__enews_module.sql`
> Chạy sau tất cả migration hiện có.

---

## Bảng 1: `chuyen_muc` — Danh mục cây (Adjacency List)

```sql
CREATE TABLE chuyen_muc (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  ten             VARCHAR(200) NOT NULL                    COMMENT 'Tên hiển thị: "Ba chương trình"',
  slug            VARCHAR(200) NOT NULL UNIQUE             COMMENT 'Slug riêng cấp này: "ba-chuong-trinh"',
  full_path_slug  VARCHAR(1000) NOT NULL UNIQUE            COMMENT 'Full path: "doan-thanh-nien/ba-chuong-trinh"',
  duong_dan       VARCHAR(1000) NOT NULL                   COMMENT 'Path ID: "1/2" — dùng LIKE query con cháu',
  parent_id       BIGINT NULL                              COMMENT 'NULL = node gốc; FK tự tham chiếu',
  cap             INT NOT NULL DEFAULT 1                   COMMENT 'Cấp node: 1, 2, 3...',
  mo_ta           VARCHAR(500) NULL,
  mau_sac         VARCHAR(20) NULL                         COMMENT 'Mã màu HEX: #0017B0',
  icon            VARCHAR(50) NULL                         COMMENT 'Tên icon Lucide React',
  to_chuc         ENUM('DOAN','HOI','BAN_DOI_CLB','CHUNG') NULL COMMENT 'Dùng để filter quyền đăng bài theo đơn vị',
  ban_id          VARCHAR(20) NULL                         COMMENT 'FK → ban.ma_ban nếu thuộc Ban/Đội/CLB cụ thể',
  thu_tu          INT NOT NULL DEFAULT 0                   COMMENT 'Thứ tự trong cùng cấp cha',
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_id) REFERENCES chuyen_muc(id) ON DELETE SET NULL,
  FOREIGN KEY (ban_id)    REFERENCES ban(ma_ban)     ON DELETE SET NULL,
  INDEX idx_parent_id     (parent_id),
  INDEX idx_duong_dan     (duong_dan(255)),
  INDEX idx_full_path     (full_path_slug(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh mục bài viết — cây N cấp dùng Adjacency List';
```

---

## Bảng 2: `tin_tuc` — Bài đăng

```sql
CREATE TABLE tin_tuc (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  tieu_de         VARCHAR(500) NOT NULL,
  slug            VARCHAR(500) NOT NULL                    COMMENT 'Slug sinh từ tiêu đề, max 80 ký tự',
  full_url_path   VARCHAR(1000) NOT NULL UNIQUE            COMMENT 'Full path URL: "cat1/cat2/slug-bai"',
  tom_tat         TEXT NULL                                COMMENT 'Tóm tắt, max 300 ký tự, dùng cho SEO description',
  noi_dung        LONGTEXT NULL                            COMMENT 'Nội dung HTML từ rich text editor',
  anh_dai_dien    VARCHAR(500) NULL                        COMMENT 'URL ảnh đại diện',
  chuyen_muc_id   BIGINT NOT NULL                          COMMENT 'FK → chuyen_muc.id',
  van_ban_id      BIGINT NULL                              COMMENT 'FK → van_ban.id (nullable — liên kết tùy chọn)',
  hoat_dong_id    VARCHAR(50) NULL                         COMMENT 'FK → hoat_dong.ma_hoat_dong (nullable)',
  trang_thai      ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  is_ghim         TINYINT(1) NOT NULL DEFAULT 0            COMMENT 'Ghim lên đầu trang chủ',
  nguoi_tao       VARCHAR(50) NOT NULL                     COMMENT 'FK → tai_khoan.username',
  don_vi_dang     VARCHAR(100) NULL                        COMMENT 'Tên đơn vị đăng: "Đoàn TN Trường ĐH Kiên Giang"',
  luot_xem        INT NOT NULL DEFAULT 0,
  ngay_xuat_ban   DATETIME NULL                            COMMENT 'Set khi status → PUBLISHED',
  is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (chuyen_muc_id) REFERENCES chuyen_muc(id),
  FOREIGN KEY (van_ban_id)    REFERENCES van_ban(id) ON DELETE SET NULL,
  INDEX idx_chuyen_muc   (chuyen_muc_id),
  INDEX idx_trang_thai   (trang_thai),
  INDEX idx_nguoi_tao    (nguoi_tao),
  INDEX idx_ngay_xb      (ngay_xuat_ban),
  INDEX idx_full_url     (full_url_path(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bài đăng tin tức eNews';
```

> **Lưu ý:** Bảng `van_ban` được tạo trước `tin_tuc` vì có FK.

---

## Bảng 3: `van_ban` — Văn bản / Kế hoạch

```sql
CREATE TABLE van_ban (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  so_hieu         VARCHAR(100) NULL                        COMMENT '"12/KH-ĐTN", "05/QĐ-HSV"',
  trich_yeu       VARCHAR(1000) NOT NULL                   COMMENT 'Tiêu đề / trích yếu',
  slug            VARCHAR(500) NOT NULL UNIQUE             COMMENT 'Slug từ so_hieu + trich_yeu',
  full_url_path   VARCHAR(1000) NOT NULL UNIQUE,
  loai_van_ban    ENUM(
    'KE_HOACH',
    'CONG_VAN',
    'QUYET_DINH',
    'THONG_BAO',
    'BAO_CAO',
    'HUONG_DAN',
    'BIEN_BAN',
    'TO_TRINH',
    'KHAC'
  ) NOT NULL,
  chuyen_muc_id   BIGINT NULL                              COMMENT 'FK → chuyen_muc.id (nullable)',
  co_quan_ban_hanh VARCHAR(200) NULL                       COMMENT '"Đoàn TN Trường ĐH Kiên Giang"',
  nguoi_ky        VARCHAR(200) NULL                        COMMENT '"Nguyễn Văn A — Bí thư"',
  ngay_ban_hanh   DATE NULL                                COMMENT 'Ngày ký ban hành chính thức',
  ngay_hieu_luc   DATE NULL,
  ngay_het_han    DATE NULL                                COMMENT 'NULL = còn hiệu lực vĩnh viễn',
  hoat_dong_id    VARCHAR(50) NULL                         COMMENT 'FK → hoat_dong.ma_hoat_dong (nullable)',
  trang_thai      ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  hieu_luc        ENUM('CON_HIEU_LUC','HET_HIEU_LUC','CHUA_HIEU_LUC') NOT NULL DEFAULT 'CON_HIEU_LUC',
  nguoi_dang      VARCHAR(50) NOT NULL                     COMMENT 'FK → tai_khoan.username',
  don_vi_dang     VARCHAR(100) NULL,
  luot_xem        INT NOT NULL DEFAULT 0,
  luot_tai        INT NOT NULL DEFAULT 0,
  is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (chuyen_muc_id) REFERENCES chuyen_muc(id) ON DELETE SET NULL,
  INDEX idx_so_hieu    (so_hieu),
  INDEX idx_loai       (loai_van_ban),
  INDEX idx_trang_thai (trang_thai),
  INDEX idx_ngay_bh    (ngay_ban_hanh)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Kho văn bản / kế hoạch / công văn';
```

> **Quy tắc nghiệp vụ quan trọng:**
> Văn bản đã PUBLISHED = bất biến. Không có version 2.
> Nếu sửa đổi → tạo van_ban mới với số hiệu mới.
> Backend phải enforce: một khi trang_thai = PUBLISHED thì không cho phép upload file mới hay thay đổi nội dung.

---

## Bảng 4: `van_ban_file` — File đính kèm của văn bản

```sql
CREATE TABLE van_ban_file (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  van_ban_id      BIGINT NOT NULL                          COMMENT 'FK → van_ban.id',
  ten_file_goc    VARCHAR(500) NOT NULL                    COMMENT 'Tên file gốc khi upload: "ke-hoach.pdf"',
  ten_hien_thi    VARCHAR(500) NULL                        COMMENT 'Tên hiển thị đẹp: "Kế hoạch TNTN 2025.pdf"',
  duong_dan       VARCHAR(1000) NOT NULL                   COMMENT 'Path lưu: /uploads/van-ban/2025/03/{uuid}.pdf',
  loai_file       VARCHAR(20) NOT NULL                     COMMENT 'pdf / docx / xlsx / pptx',
  kich_thuoc      BIGINT NOT NULL                          COMMENT 'Kích thước bytes',
  nguoi_upload    VARCHAR(50) NOT NULL,
  ngay_upload     DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (van_ban_id) REFERENCES van_ban(id) ON DELETE CASCADE,
  INDEX idx_van_ban_id (van_ban_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='File đính kèm của văn bản — 1 văn bản có đúng 1 file chính';
```

> **Lưu ý:** Không có cột `phien_ban` hay `la_ban_chinh`. Mỗi `van_ban` chỉ có **1 file duy nhất**.
> Thay thế file chỉ được phép khi `van_ban.trang_thai = DRAFT`.

---

## Bảng 5: `tin_tuc_anh` — Ảnh trong gallery bài viết (optional)

```sql
CREATE TABLE tin_tuc_anh (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  tin_tuc_id      BIGINT NOT NULL,
  duong_dan       VARCHAR(1000) NOT NULL,
  ten_file_goc    VARCHAR(500) NULL,
  mo_ta           VARCHAR(500) NULL                        COMMENT 'Alt text cho ảnh',
  thu_tu          INT NOT NULL DEFAULT 0,
  ngay_upload     DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tin_tuc_id) REFERENCES tin_tuc(id) ON DELETE CASCADE,
  INDEX idx_tin_tuc_id (tin_tuc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Bảng 6: `url_redirect` — 301 Redirect khi đổi slug

```sql
CREATE TABLE url_redirect (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  url_cu      VARCHAR(1000) NOT NULL                       COMMENT 'Path cũ không có dấu /',
  url_moi     VARCHAR(1000) NOT NULL                       COMMENT 'Path mới không có dấu /',
  kieu        INT NOT NULL DEFAULT 301                     COMMENT '301 permanent / 302 temporary',
  ly_do       VARCHAR(500) NULL                            COMMENT 'Ghi chú lý do redirect',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_url_cu (url_cu(500))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lưu redirect khi đổi tên danh mục làm thay đổi slug';
```

---

## Seed data danh mục mặc định

```sql
-- Cấp 1
INSERT INTO chuyen_muc (id, ten, slug, full_path_slug, duong_dan, parent_id, cap, to_chuc, mau_sac, icon, thu_tu)
VALUES
  (1, 'Đoàn Thanh Niên',  'doan-thanh-nien',  'doan-thanh-nien',  '1',  NULL, 1, 'DOAN',         '#0017B0', 'Star',   1),
  (2, 'Hội Sinh Viên',    'hoi-sinh-vien',    'hoi-sinh-vien',    '2',  NULL, 1, 'HOI',          '#059669', 'Users',  2),
  (3, 'Ban - Đội - CLB',  'ban-doi-clb',      'ban-doi-clb',      '3',  NULL, 1, 'BAN_DOI_CLB',  '#7C3AED', 'Shield', 3),
  (4, 'Thông báo chung',  'thong-bao-chung',  'thong-bao-chung',  '4',  NULL, 1, 'CHUNG',        '#DC2626', 'Bell',   4);

-- Cấp 2 — Đoàn Thanh Niên
INSERT INTO chuyen_muc (id, ten, slug, full_path_slug, duong_dan, parent_id, cap, to_chuc, thu_tu)
VALUES
  (10, 'Tin tức - Sự kiện',        'tin-tuc-su-kien',        'doan-thanh-nien/tin-tuc-su-kien',        '1/10', 1, 2, 'DOAN', 1),
  (11, 'Ba chương trình',          'ba-chuong-trinh',        'doan-thanh-nien/ba-chuong-trinh',        '1/11', 1, 2, 'DOAN', 2),
  (12, 'Ba phong trào',            'ba-phong-trao',          'doan-thanh-nien/ba-phong-trao',          '1/12', 1, 2, 'DOAN', 3),
  (13, 'Công tác giáo dục',        'cong-tac-giao-duc',      'doan-thanh-nien/cong-tac-giao-duc',      '1/13', 1, 2, 'DOAN', 4),
  (14, 'Hội nhập quốc tế',         'hoi-nhap-quoc-te',       'doan-thanh-nien/hoi-nhap-quoc-te',       '1/14', 1, 2, 'DOAN', 5),
  (15, 'Xây dựng Đoàn',            'xay-dung-doan',          'doan-thanh-nien/xay-dung-doan',          '1/15', 1, 2, 'DOAN', 6),
  (16, 'Kế hoạch - Văn bản Đoàn', 'ke-hoach-van-ban-doan',  'doan-thanh-nien/ke-hoach-van-ban-doan',  '1/16', 1, 2, 'DOAN', 7);

-- Cấp 3 — Ba chương trình
INSERT INTO chuyen_muc (id, ten, slug, full_path_slug, duong_dan, parent_id, cap, to_chuc, thu_tu)
VALUES
  (20, 'Thanh niên tình nguyện', 'thanh-nien-tinh-nguyen', 'doan-thanh-nien/ba-chuong-trinh/thanh-nien-tinh-nguyen', '1/11/20', 11, 3, 'DOAN', 1),
  (21, 'Tuổi trẻ sáng tạo',     'tuoi-tre-sang-tao',      'doan-thanh-nien/ba-chuong-trinh/tuoi-tre-sang-tao',      '1/11/21', 11, 3, 'DOAN', 2),
  (22, 'Tuổi trẻ xung kích',    'tuoi-tre-xung-kich',     'doan-thanh-nien/ba-chuong-trinh/tuoi-tre-xung-kich',     '1/11/22', 11, 3, 'DOAN', 3);

-- Cấp 2 — Hội Sinh Viên
INSERT INTO chuyen_muc (id, ten, slug, full_path_slug, duong_dan, parent_id, cap, to_chuc, thu_tu)
VALUES
  (30, 'Tin tức - Sự kiện Hội',    'tin-tuc-su-kien-hoi',   'hoi-sinh-vien/tin-tuc-su-kien-hoi',   '2/30', 2, 2, 'HOI', 1),
  (31, 'Kế hoạch - Văn bản Hội',  'ke-hoach-van-ban-hoi',  'hoi-sinh-vien/ke-hoach-van-ban-hoi',  '2/31', 2, 2, 'HOI', 2),
  (32, 'Hỗ trợ sinh viên',        'ho-tro-sinh-vien',      'hoi-sinh-vien/ho-tro-sinh-vien',      '2/32', 2, 2, 'HOI', 3),
  (33, 'Thông báo Hội',           'thong-bao-hoi',         'hoi-sinh-vien/thong-bao-hoi',         '2/33', 2, 2, 'HOI', 4);
```

---

## Ràng buộc nghiệp vụ cần enforce ở tầng Service (không chỉ DB)

| Quy tắc | Mô tả |
|---|---|
| VB-001 | `van_ban.trang_thai = PUBLISHED` → không cho sửa bất kỳ field nào, không cho upload file mới |
| VB-002 | Mỗi `van_ban` chỉ có tối đa 1 bản ghi trong `van_ban_file` |
| TT-001 | `hoat_dong_id` trong `tin_tuc` phải tồn tại trong bảng `hoat_dong` nếu không NULL |
| TT-002 | Khi set `trang_thai = PUBLISHED` → tự động set `ngay_xuat_ban = NOW()` |
| CM-001 | Khi đổi `ten` của `chuyen_muc` → tự động recalculate `slug`, `full_path_slug`, `duong_dan` của toàn bộ subtree + insert `url_redirect` |
| CM-002 | Không cho xóa `chuyen_muc` nếu còn `tin_tuc` hoặc `van_ban` đang dùng |
