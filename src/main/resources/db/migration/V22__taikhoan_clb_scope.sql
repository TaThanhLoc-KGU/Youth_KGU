-- V22: Gán CLB scope cho tài khoản (chủ nhiệm / quản lý CLB)
-- Tương tự ma_khoa (khoa scope), nhưng dành cho CLB/Đội/Nhóm

-- Bước 1: Thêm cột (IF NOT EXISTS an toàn trên MariaDB)
ALTER TABLE taikhoan
    ADD COLUMN IF NOT EXISTS ma_clb VARCHAR(20) NULL
        COMMENT 'CLB scope: null = không giới hạn, non-null = chỉ quản lý CLB này';

-- Bước 2: Thêm foreign key riêng (MariaDB không hỗ trợ ADD CONSTRAINT IF NOT EXISTS cho FK)
ALTER TABLE taikhoan
    ADD CONSTRAINT fk_taikhoan_clb
        FOREIGN KEY (ma_clb) REFERENCES cau_lac_bo(ma_clb)
        ON DELETE SET NULL ON UPDATE CASCADE;
