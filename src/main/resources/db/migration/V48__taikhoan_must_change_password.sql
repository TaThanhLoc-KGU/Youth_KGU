-- Thêm cờ buộc đổi mật khẩu lần đầu đăng nhập
ALTER TABLE taikhoan
    ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1 = buộc đổi mật khẩu (mật khẩu mặc định hoặc do admin reset)';
