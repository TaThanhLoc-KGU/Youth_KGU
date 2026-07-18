-- Hoạt động không đăng ký: sinh viên tham gia nhưng không cần đăng ký trước (kêu gọi offline)
ALTER TABLE hoat_dong
    ADD COLUMN is_khong_dang_ky BOOLEAN NOT NULL DEFAULT FALSE;
