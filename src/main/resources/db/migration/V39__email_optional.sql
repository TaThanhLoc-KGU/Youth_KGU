-- V39: Email không còn bắt buộc — cho phép NULL
-- Giữ UNIQUE nhưng NULL không vi phạm unique constraint trong MySQL/MariaDB
ALTER TABLE `taikhoan`
    MODIFY COLUMN `email` VARCHAR(255) NULL;
