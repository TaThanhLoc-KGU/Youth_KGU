-- ================================================================
-- V29: Phân hệ Điểm Rèn Luyện
--   - drl_mau_danh_gia   : mẫu đánh giá (có versioning)
--   - drl_danh_muc       : danh mục I..VI thuộc 1 phiên bản mẫu
--   - drl_tieu_chi       : tiêu chí 1.1, 1.2... thuộc danh mục
--   - diem_ren_luyen     : điểm sinh viên (FK → mau_id)
--   - diem_ren_luyen_lich_su : lịch sử mỗi lần thay đổi điểm
-- ================================================================

-- ── 1. Mẫu đánh giá ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drl_mau_danh_gia (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    ten_mau     VARCHAR(200) NOT NULL           COMMENT 'VD: Quy chế ĐRL 2024-2025',
    mo_ta       TEXT         NULL,
    nam_hoc     VARCHAR(20)  NULL               COMMENT 'VD: 2024-2025',
    phien_ban   INT          NOT NULL DEFAULT 1 COMMENT 'Version 1, 2, 3...',
    mau_cha_id  BIGINT       NULL               COMMENT 'NULL = bản gốc; >0 = clone từ bản cha',
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_by  VARCHAR(100) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dmg_nam_hoc   (nam_hoc),
    INDEX idx_dmg_mau_cha   (mau_cha_id),
    CONSTRAINT fk_dmg_cha FOREIGN KEY (mau_cha_id)
        REFERENCES drl_mau_danh_gia (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ── 2. Danh mục (I, II, III...) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS drl_danh_muc (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    mau_id        BIGINT       NOT NULL,
    ma_danh_muc   VARCHAR(10)  NOT NULL  COMMENT 'I, II, III, IV, V, VI',
    ten_danh_muc  VARCHAR(500) NOT NULL,
    diem_toi_da   INT          NOT NULL DEFAULT 0,
    thu_tu        INT          NOT NULL DEFAULT 0,
    INDEX idx_dm_mau (mau_id),
    CONSTRAINT fk_dm_mau FOREIGN KEY (mau_id)
        REFERENCES drl_mau_danh_gia (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ── 3. Tiêu chí (1.1, 1.2...) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS drl_tieu_chi (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    danh_muc_id   BIGINT       NOT NULL,
    ma_tieu_chi   VARCHAR(20)  NOT NULL  COMMENT '1.1, 1.2, 2.1...',
    noi_dung      TEXT         NOT NULL,
    diem_toi_da   INT          NOT NULL DEFAULT 0,
    chi_tiet      TEXT         NULL      COMMENT 'JSON: sub-items nếu có, VD KHA/GIOI/XUAT_SAC',
    thu_tu        INT          NOT NULL DEFAULT 0,
    INDEX idx_tc_danh_muc (danh_muc_id),
    CONSTRAINT fk_tc_danh_muc FOREIGN KEY (danh_muc_id)
        REFERENCES drl_danh_muc (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ── 4. Điểm rèn luyện sinh viên ──────────────────────────────────
CREATE TABLE IF NOT EXISTS diem_ren_luyen (
    id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
    ma_sv          VARCHAR(50)  NOT NULL,
    ma_hoc_ky      VARCHAR(20)  NOT NULL,
    mau_id         BIGINT       NOT NULL  COMMENT 'FK → drl_mau_danh_gia.id (mẫu được dùng để chấm)',
    scores         TEXT         NULL      COMMENT 'JSON: {"1.1":15,"1.2":3,...}',
    tong_diem      INT          NOT NULL DEFAULT 0,
    xep_loai       VARCHAR(20)  NULL      COMMENT 'XUAT_SAC|TOT|KHA|TRUNG_BINH|YEU|KEM',
    trang_thai     VARCHAR(20)  NOT NULL DEFAULT 'NHAP' COMMENT 'NHAP|DA_DUYET|KHOA',
    version        INT          NOT NULL DEFAULT 1,
    ghi_chu        TEXT         NULL,
    nguoi_tao      VARCHAR(100) NULL,
    nguoi_cap_nhat VARCHAR(100) NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_drl_sv_hk (ma_sv, ma_hoc_ky),
    INDEX idx_drl_ma_hoc_ky  (ma_hoc_ky),
    INDEX idx_drl_mau_id     (mau_id),
    INDEX idx_drl_trang_thai (trang_thai),
    CONSTRAINT fk_drl_mau FOREIGN KEY (mau_id)
        REFERENCES drl_mau_danh_gia (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ── 5. Lịch sử điểm ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diem_ren_luyen_lich_su (
    id                BIGINT       AUTO_INCREMENT PRIMARY KEY,
    drl_id            BIGINT       NOT NULL,
    ma_sv             VARCHAR(50)  NOT NULL,
    ma_hoc_ky         VARCHAR(20)  NOT NULL,
    mau_id            BIGINT       NOT NULL  COMMENT 'Snapshot: mẫu được dùng tại thời điểm này',
    version           INT          NOT NULL,
    scores            TEXT         NULL,
    tong_diem         INT          NOT NULL DEFAULT 0,
    xep_loai          VARCHAR(20)  NULL,
    ghi_chu           TEXT         NULL,
    ly_do_thay_doi    TEXT         NULL,
    nguoi_thuc_hien   VARCHAR(100) NULL,
    thoi_gian         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_drls_drl_id  (drl_id),
    INDEX idx_drls_sv_hk   (ma_sv, ma_hoc_ky),
    CONSTRAINT fk_drls_drl FOREIGN KEY (drl_id)
        REFERENCES diem_ren_luyen (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ── 6. Permission ─────────────────────────────────────────────────
INSERT IGNORE INTO permissions (category, name, description)
VALUES
    ('DIEM_REN_LUYEN', 'QUAN_LY_DIEM_REN_LUYEN', 'Nhập, sửa, phê duyệt điểm rèn luyện sinh viên'),
    ('DIEM_REN_LUYEN', 'QUAN_LY_MAU_DANH_GIA',   'Tạo, sửa, clone mẫu đánh giá điểm rèn luyện');


-- ── 7. Seed mẫu đánh giá gốc (migrate từ JSON hiện tại) ──────────
INSERT INTO drl_mau_danh_gia (id, ten_mau, mo_ta, nam_hoc, phien_ban, mau_cha_id, is_active, created_by)
VALUES (1, 'Quy chế ĐRL mặc định', 'Migrate từ file diem-ren-luyen-criteria.json', NULL, 1, NULL, 1, 'system');

-- Danh mục I
INSERT INTO drl_danh_muc (mau_id, ma_danh_muc, ten_danh_muc, diem_toi_da, thu_tu) VALUES
(1, 'I',   'Ý thức tham gia học tập',                          20, 1),
(1, 'II',  'Ý thức chấp hành nội quy, quy chế',               25, 2),
(1, 'III', 'Hoạt động chính trị xã hội, văn nghệ, thể thao',  20, 3),
(1, 'IV',  'Ý thức công dân trong quan hệ cộng đồng',         25, 4),
(1, 'V',   'Công tác cán bộ lớp, đoàn thể, thành tích đặc biệt', 10, 5),
(1, 'VI',  'Điểm cộng ngoài khung',                           30, 6);

-- Tiêu chí danh mục I (id=1)
INSERT INTO drl_tieu_chi (danh_muc_id, ma_tieu_chi, noi_dung, diem_toi_da, chi_tiet, thu_tu) VALUES
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='I'),
 '1.1', 'Kết quả học tập trong học kỳ', 20,
 '[{"id":"1.1.KHA","noi_dung":"Khá","diem":10},{"id":"1.1.GIOI","noi_dung":"Giỏi","diem":15},{"id":"1.1.XUAT_SAC","noi_dung":"Xuất sắc","diem":20}]', 1),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='I'),
 '1.2', 'Điểm trung bình học kỳ tăng so với học kỳ trước (SV học kỳ I năm 1 được tính)', 5, NULL, 2),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='I'),
 '1.3', 'Tham gia hoạt động học thuật, nghiên cứu khoa học (có minh chứng)', 5, NULL, 3);

-- Tiêu chí danh mục II (id=2)
INSERT INTO drl_tieu_chi (danh_muc_id, ma_tieu_chi, noi_dung, diem_toi_da, chi_tiet, thu_tu) VALUES
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='II'),
 '2.1', 'Không vi phạm nội quy, quy chế trong Nhà trường; đóng học phí đúng hạn, xác nhận học phần đúng tiến độ, tuân thủ quy chế thi (vi phạm trừ 5đ/lần)', 15, NULL, 1),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='II'),
 '2.2', 'Không vi phạm tệ nạn xã hội, an toàn giao thông, không hút thuốc', 10, NULL, 2);

-- Tiêu chí danh mục III
INSERT INTO drl_tieu_chi (danh_muc_id, ma_tieu_chi, noi_dung, diem_toi_da, chi_tiet, thu_tu) VALUES
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='III'),
 '3.1', 'Tham gia hoạt động công ích, phòng chống tệ nạn, tình nguyện, mùa hè xanh, tiếp sức mùa thi (cộng 5đ/hoạt động có minh chứng)', 10, NULL, 1),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='III'),
 '3.2', 'Thành viên đội văn hóa, văn nghệ, thể thao, câu lạc bộ cấp Khoa', 5, NULL, 2),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='III'),
 '3.3', 'Thành viên đội văn hóa, văn nghệ, thể thao, câu lạc bộ cấp Trường', 10, NULL, 3),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='III'),
 '3.4', 'Tham gia, cổ vũ hoạt động do Khoa/Trường phát động; tham dự chương trình, hội nghị của Khoa/Trường (cộng 5đ hoặc 3đ/hoạt động có minh chứng)', 15, NULL, 4);

-- Tiêu chí danh mục IV
INSERT INTO drl_tieu_chi (danh_muc_id, ma_tieu_chi, noi_dung, diem_toi_da, chi_tiet, thu_tu) VALUES
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='IV'),
 '4.1', 'Chấp hành chủ trương, đường lối Đảng, pháp luật Nhà nước; tham gia bảo hiểm y tế theo quy định', 15, NULL, 1),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='IV'),
 '4.2', 'Hòa đồng, nhiệt tình giúp đỡ bạn bè; xây dựng đoàn kết, không gây mất đoàn kết nội bộ', 3, NULL, 2),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='IV'),
 '4.3', 'Tham gia hoạt động cộng đồng tại địa phương (có minh chứng trong học kỳ)', 2, NULL, 3),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='IV'),
 '4.4', 'Tham gia hiến máu nhân đạo (có giấy chứng nhận)', 5, NULL, 4);

-- Tiêu chí danh mục V
INSERT INTO drl_tieu_chi (danh_muc_id, ma_tieu_chi, noi_dung, diem_toi_da, chi_tiet, thu_tu) VALUES
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='V'),
 '5.1', 'Là ban cán sự lớp/lớp học phần; Thành viên BCH Đoàn-Hội, Đội TNXK hoàn thành nhiệm vụ; Thành viên Ban Chủ nhiệm CLB', 5, NULL, 1),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='V'),
 '5.2', 'Tham gia đầy đủ các buổi sinh hoạt lớp', 5, NULL, 2);

-- Tiêu chí danh mục VI
INSERT INTO drl_tieu_chi (danh_muc_id, ma_tieu_chi, noi_dung, diem_toi_da, chi_tiet, thu_tu) VALUES
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='VI'),
 '6.1', 'Đạt giải khuyến khích trở lên trong hoạt động học thuật, NCKH, văn hóa, văn nghệ, TDTT từ cấp Trường trở lên (có minh chứng)', 10, NULL, 1),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='VI'),
 '6.2', 'Đạt danh hiệu "Sinh viên 5 tốt" cấp Trường trở lên (có minh chứng bằng Quyết định)', 10, NULL, 2),
((SELECT id FROM drl_danh_muc WHERE mau_id=1 AND ma_danh_muc='VI'),
 '6.3', 'Có thành tích tiêu biểu xuất sắc (SV tự minh chứng; điểm chính thức do hội đồng cấp trường quyết định)', 10, NULL, 3);
