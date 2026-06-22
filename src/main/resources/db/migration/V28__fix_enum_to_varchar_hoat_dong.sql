-- V28: Chuyển các cột ENUM sang VARCHAR để linh hoạt và tránh lỗi Data Truncated
-- Tác động bảng hoat_dong: trang_thai, cap_do, loai_hoat_dong

-- 1. Cập nhật cột trang_thai (đang bị lỗi khi lưu CHO_DUYET)
ALTER TABLE hoat_dong MODIFY trang_thai VARCHAR(50) NOT NULL;

-- 2. Đảm bảo cap_do là VARCHAR (V26 đã làm nhưng làm lại cho chắc chắn đồng bộ)
ALTER TABLE hoat_dong MODIFY cap_do VARCHAR(50) NOT NULL;

-- 3. Cập nhật cột loai_hoat_dong
ALTER TABLE hoat_dong MODIFY loai_hoat_dong VARCHAR(50) NOT NULL;

-- 4. Cập nhật các bản ghi hiện có (nếu cần chuẩn hóa tên Enum)
-- Không cần vì data hiện tại đã khớp với tên Enum trong Java.
