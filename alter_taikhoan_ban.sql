-- 1. Thêm cột ma_ban vào bảng taikhoan
ALTER TABLE taikhoan ADD COLUMN ma_ban VARCHAR(20) DEFAULT NULL;

-- 2. Thêm khóa ngoại liên kết với bảng ban
ALTER TABLE taikhoan ADD CONSTRAINT fk_taikhoan_ban FOREIGN KEY (ma_ban) REFERENCES ban(ma_ban);

-- 3. (Tùy chọn) Xóa cột ban_chuyen_mon cũ nếu không cần thiết nữa
-- ALTER TABLE taikhoan DROP COLUMN ban_chuyen_mon;
