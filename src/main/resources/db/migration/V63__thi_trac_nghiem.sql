-- V63__thi_trac_nghiem.sql
-- Flyway ĐANG TẮT (spring.flyway.enabled=false). Toàn bộ bảng tn_* được Hibernate ddl-auto=update
-- TỰ TẠO từ @Entity khi app khởi động — phần CREATE TABLE bên dưới CHỈ để tài liệu/tham khảo.
--
-- Quyền THI_TN_* do DataInitializer.initializePermissions() tạo từ seed/permissions-catalog.txt
-- mỗi lần khởi động — KHÔNG cần chạy tay.
--
-- Phần INSERT role_default_permissions bên dưới KHÔNG có code chạy tự động cho DB đã có sẵn dữ liệu
-- (DataInitializer chỉ seed baseline cho vai trò đang có 0 dòng). PHẢI CHẠY TAY 1 LẦN trên prod nếu
-- muốn cán bộ khoa (QUAN_LY_KHOA / PHO_QUAN_LY_KHOA) dùng được tính năng — nếu bỏ qua, chỉ ADMIN
-- (bypass mọi quyền) dùng được, hoặc admin tự cấp quyền trên trang "Phân quyền".

SET NAMES utf8mb4;

-- ============================================================ NGÂN HÀNG CÂU HỎI

CREATE TABLE IF NOT EXISTS tn_danh_muc (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten        VARCHAR(200) NOT NULL,
    mo_ta      VARCHAR(500),
    parent_id  BIGINT NULL,
    ma_khoa    VARCHAR(50) COLLATE utf8mb4_unicode_ci NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(50),
    created_at DATETIME, updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tn_cau_hoi (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    noi_dung    TEXT NOT NULL,
    loai        VARCHAR(20) NOT NULL DEFAULT 'MOT_DAP_AN',
    do_kho      VARCHAR(15) NOT NULL DEFAULT 'TRUNG_BINH',
    danh_muc_id BIGINT NULL,
    diem        DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    giai_thich  TEXT,
    hinh_anh    VARCHAR(500),
    ma_khoa     VARCHAR(50) COLLATE utf8mb4_unicode_ci NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,   -- soft-delete: KHÔNG xoá cứng câu đã dùng
    created_by  VARCHAR(50),
    created_at  DATETIME, updated_at DATETIME,
    INDEX idx_tn_ch_boc (is_active, do_kho, danh_muc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tn_dap_an (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    cau_hoi_id BIGINT NOT NULL,
    noi_dung   TEXT NOT NULL,
    dung       BOOLEAN NOT NULL DEFAULT FALSE,
    thu_tu     INT NOT NULL DEFAULT 0,
    hinh_anh   VARCHAR(500),
    CONSTRAINT fk_tn_da_ch FOREIGN KEY (cau_hoi_id) REFERENCES tn_cau_hoi(id) ON DELETE CASCADE,
    INDEX idx_tn_da_ch (cau_hoi_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================ ĐỀ THI

CREATE TABLE IF NOT EXISTS tn_de_thi (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tieu_de             VARCHAR(300) NOT NULL,
    mo_ta               TEXT,
    che_do              VARCHAR(15) NOT NULL DEFAULT 'CO_DINH',   -- CO_DINH | NGAU_NHIEN
    ma_hoat_dong        VARCHAR(50) NULL,
    ma_khoa             VARCHAR(50) COLLATE utf8mb4_unicode_ci NULL,
    thoi_luong_phut     INT NOT NULL DEFAULT 30,
    mo_luc              DATETIME NULL, dong_luc DATETIME NULL,
    so_lan_lam_toi_da   INT NOT NULL DEFAULT 1,
    tron_cau_hoi        BOOLEAN NOT NULL DEFAULT TRUE,
    tron_dap_an         BOOLEAN NOT NULL DEFAULT TRUE,
    cham_diem_tung_phan BOOLEAN NOT NULL DEFAULT FALSE,
    thang_diem          DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    diem_dat            DECIMAL(5,2) NULL,
    che_do_hien_ket_qua VARCHAR(20) NOT NULL DEFAULT 'NGAY',      -- NGAY | SAU_KHI_DONG | KHONG
    cho_xem_lai_bai     BOOLEAN NOT NULL DEFAULT TRUE,
    hien_dap_an_dung    BOOLEAN NOT NULL DEFAULT TRUE,
    tong_so_cau         INT NOT NULL DEFAULT 0,
    trang_thai          VARCHAR(15) NOT NULL DEFAULT 'NHAP',      -- NHAP | DA_XUAT_BAN | DONG
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_by          VARCHAR(50),
    created_at          DATETIME, updated_at DATETIME,
    INDEX idx_tn_dt_trangthai (trang_thai, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tn_de_thi_cau_hoi (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    de_thi_id   BIGINT NOT NULL,
    cau_hoi_id  BIGINT NOT NULL,
    thu_tu      INT NOT NULL DEFAULT 0,
    diem_ghi_de DECIMAL(4,2) NULL,
    CONSTRAINT fk_tn_dtch_dt FOREIGN KEY (de_thi_id)  REFERENCES tn_de_thi(id)  ON DELETE CASCADE,
    CONSTRAINT fk_tn_dtch_ch FOREIGN KEY (cau_hoi_id) REFERENCES tn_cau_hoi(id),
    UNIQUE KEY uq_tn_dtch (de_thi_id, cau_hoi_id),
    INDEX idx_tn_dtch_dt (de_thi_id, thu_tu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tn_ma_tran (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    de_thi_id    BIGINT NOT NULL,
    danh_muc_id  BIGINT NULL,
    do_kho       VARCHAR(15) NULL,
    so_luong     INT NOT NULL,
    diem_moi_cau DECIMAL(4,2) NULL,
    thu_tu       INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_tn_mt_dt FOREIGN KEY (de_thi_id) REFERENCES tn_de_thi(id) ON DELETE CASCADE,
    INDEX idx_tn_mt_dt (de_thi_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================ LƯỢT THI (bộ đề khoá cứng)

CREATE TABLE IF NOT EXISTS tn_luot_thi (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    de_thi_id         BIGINT NOT NULL,
    ma_sv             VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL,
    lan_thu           INT NOT NULL DEFAULT 1,
    trang_thai        VARCHAR(15) NOT NULL DEFAULT 'DANG_LAM',   -- DANG_LAM | DA_NOP | TU_DONG_NOP
    thoi_gian_bat_dau DATETIME NOT NULL,
    thoi_gian_han_nop DATETIME NOT NULL,   -- = bat_dau + thoi_luong (server tính, nguồn sự thật)
    thoi_gian_nop     DATETIME NULL,
    diem              DECIMAL(5,2) NULL,
    diem_tho          DECIMAL(7,2) NULL,
    tong_diem_toi_da  DECIMAL(7,2) NULL,
    so_cau_dung       INT NULL,
    tong_so_cau       INT NOT NULL,
    dat               BOOLEAN NULL,
    ip_address        VARCHAR(45), user_agent VARCHAR(255),
    created_at        DATETIME, updated_at DATETIME,
    CONSTRAINT fk_tn_lt_dt FOREIGN KEY (de_thi_id) REFERENCES tn_de_thi(id),
    CONSTRAINT fk_tn_lt_sv FOREIGN KEY (ma_sv)     REFERENCES sinhvien(ma_sv),
    UNIQUE KEY uq_tn_lt (de_thi_id, ma_sv, lan_thu),
    INDEX idx_tn_lt_sv (ma_sv, trang_thai),
    INDEX idx_tn_lt_dt (de_thi_id, trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tn_luot_thi_cau_hoi (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    luot_thi_id         BIGINT NOT NULL,
    cau_hoi_id          BIGINT NOT NULL,          -- ID câu hỏi GHI CỨNG
    thu_tu              INT NOT NULL,             -- vị trí trong lượt này (sau khi trộn)
    diem                DECIMAL(4,2) NOT NULL,
    loai                VARCHAR(20) NOT NULL,
    noi_dung_snapshot   TEXT NOT NULL,
    hinh_anh_snapshot   VARCHAR(500),
    dap_an_snapshot     JSON NOT NULL,            -- [{"id":..,"noiDung":".."}] ĐÃ trộn, KHÔNG có cờ đúng/sai
    dap_an_dung_ids     JSON NOT NULL,            -- [id,...] CHỈ server đọc để chấm
    giai_thich_snapshot TEXT,
    tra_loi             JSON NULL,                -- [answerId,...] câu trả lời thí sinh (auto-save)
    da_tra_loi          BOOLEAN NOT NULL DEFAULT FALSE,
    danh_dau            BOOLEAN NOT NULL DEFAULT FALSE,
    thoi_gian_tra_loi   DATETIME NULL,
    dung                BOOLEAN NULL,
    diem_dat_duoc       DECIMAL(4,2) NULL,
    CONSTRAINT fk_tn_ltch_lt FOREIGN KEY (luot_thi_id) REFERENCES tn_luot_thi(id) ON DELETE CASCADE,
    CONSTRAINT fk_tn_ltch_ch FOREIGN KEY (cau_hoi_id)  REFERENCES tn_cau_hoi(id),
    UNIQUE KEY uq_tn_ltch (luot_thi_id, cau_hoi_id),
    INDEX idx_tn_ltch_lt (luot_thi_id, thu_tu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lưu ý: entity JPA khai các FK trên bằng cột thường (deThiId/cauHoiId/maSv là @Column, không @ManyToOne)
-- nên Hibernate KHÔNG tự tạo FOREIGN KEY. Nếu muốn ràng buộc ở DB, chạy tay các ALTER TABLE ... ADD CONSTRAINT
-- tương ứng ở trên. Cột JSON được Hibernate tạo dưới dạng LONGTEXT (chứa chuỗi JSON) — service tự parse.

-- ============================================================ QUYỀN (chạy tay 1 lần trên prod nếu cần)

INSERT IGNORE INTO role_default_permissions (vai_tro, permission_id)
SELECT r.role, p.id FROM (
    SELECT 'QUAN_LY_KHOA'     AS role UNION ALL SELECT 'PHO_QUAN_LY_KHOA'
) r
JOIN permissions p ON p.name IN ('THI_TN_QUAN_LY_CAU_HOI','THI_TN_QUAN_LY_DE_THI','THI_TN_XEM_KET_QUA');
