-- Thêm cột ma_khoa vào taikhoan (nullable — null = Đoàn trường, không giới hạn khoa)
ALTER TABLE taikhoan
    ADD COLUMN ma_khoa VARCHAR(20) NULL DEFAULT NULL
    AFTER la_admin;

ALTER TABLE taikhoan
    ADD CONSTRAINT fk_taikhoan_khoa
    FOREIGN KEY (ma_khoa) REFERENCES khoa(ma_khoa)
    ON DELETE SET NULL ON UPDATE CASCADE;
