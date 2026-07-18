-- V41: Chữ ký số trở thành tài sản cá nhân — mỗi tài khoản có chữ ký riêng
-- owner_username NULL = chữ ký hệ thống (cũ, tương thích ngược)

ALTER TABLE chu_ky
    ADD COLUMN owner_username VARCHAR(100) NULL;

-- Index để query nhanh theo owner
CREATE INDEX idx_chu_ky_owner ON chu_ky (owner_username);
