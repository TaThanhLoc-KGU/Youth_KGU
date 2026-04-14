-- V6: Mini App Cuộc thi & Bình chọn

CREATE TABLE cuoc_thi (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    tieu_de               VARCHAR(300) NOT NULL,
    mo_ta                 TEXT,
    anh_bia               VARCHAR(500),
    slug                  VARCHAR(300) NOT NULL UNIQUE,
    loai_cuoc_thi         ENUM('CUOC_THI_HAT','ANH_DEP','Y_TUONG','TRANG_PHUC','BAI_VIET','TONG_HOP') NOT NULL DEFAULT 'TONG_HOP',
    ma_hoat_dong          VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    trang_thai            ENUM('CHUAN_BI','DANG_MO','DONG_BINH_CHON','DA_CONG_BO','DA_HUY') NOT NULL DEFAULT 'CHUAN_BI',
    hien_thi_ket_qua      ENUM('REALTIME','AN_DEN_CUOI') NOT NULL DEFAULT 'REALTIME',
    dieu_kien_vote        ENUM('MO_HOANTOAN','DANG_NHAP','CHECK_IN') NOT NULL DEFAULT 'DANG_NHAP',
    quy_tac_vote          ENUM('MOT_LAN','MOI_NGAY','N_LUOT') NOT NULL DEFAULT 'MOT_LAN',
    so_luot_toi_da        INT NULL COMMENT 'Dùng khi quy_tac_vote = N_LUOT',
    thoi_gian_mo_vote     DATETIME NULL,
    thoi_gian_dong_vote   DATETIME NULL,
    is_active             TINYINT(1) NOT NULL DEFAULT 1,
    created_by            VARCHAR(50),
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ct_ma_hoat_dong (ma_hoat_dong),
    INDEX idx_ct_trang_thai (trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE thi_sinh (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    cuoc_thi_id     BIGINT NOT NULL,
    ten             VARCHAR(200) NOT NULL,
    mo_ta           TEXT,
    anh_dai_dien    VARCHAR(500),
    url_media       VARCHAR(500) COMMENT 'Link video/bài viết nếu có',
    so_thu_tu       INT NOT NULL DEFAULT 0,
    thong_tin_them  JSON NULL COMMENT 'Extra info tùy loại cuộc thi',
    so_vote         INT NOT NULL DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ts_cuoc_thi_id (cuoc_thi_id),
    INDEX idx_ts_so_thu_tu (so_thu_tu),
    CONSTRAINT fk_thi_sinh_cuoc_thi FOREIGN KEY (cuoc_thi_id) REFERENCES cuoc_thi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE luot_binh_chon (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    thi_sinh_id          BIGINT NOT NULL,
    cuoc_thi_id          BIGINT NOT NULL,
    nguoi_vote_ma        VARCHAR(50) NULL COMMENT 'maSv/username nếu đã đăng nhập',
    nguoi_vote_ip        VARCHAR(45) NULL,
    nguoi_vote_device_id VARCHAR(100) NULL COMMENT 'Browser fingerprint',
    ngay_vote            DATE NOT NULL,
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lbc_thi_sinh_id (thi_sinh_id),
    INDEX idx_lbc_cuoc_thi_id (cuoc_thi_id),
    INDEX idx_lbc_nguoi_vote (nguoi_vote_ma, cuoc_thi_id),
    INDEX idx_lbc_ngay_vote (ngay_vote),
    CONSTRAINT fk_lbc_thi_sinh FOREIGN KEY (thi_sinh_id) REFERENCES thi_sinh(id) ON DELETE CASCADE,
    CONSTRAINT fk_lbc_cuoc_thi FOREIGN KEY (cuoc_thi_id) REFERENCES cuoc_thi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions mới
INSERT INTO permissions (category, name, description) VALUES
('CUOC_THI', 'QUAN_LY_CUOC_THI', 'Xem danh sách và chi tiết cuộc thi'),
('CUOC_THI', 'TAO_CUOC_THI',     'Tạo cuộc thi mới'),
('CUOC_THI', 'SUA_CUOC_THI',     'Sửa cuộc thi và quản lý thí sinh'),
('CUOC_THI', 'XOA_CUOC_THI',     'Xóa cuộc thi');
