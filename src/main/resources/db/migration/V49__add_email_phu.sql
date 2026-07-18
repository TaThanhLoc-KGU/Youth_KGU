    -- Thêm cột email phụ vào bảng taikhoan
    ALTER TABLE taikhoan ADD COLUMN IF NOT EXISTS email_phu VARCHAR(255) NULL;
