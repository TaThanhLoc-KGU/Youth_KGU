-- Thêm ma_khoa vào tin_tuc để hỗ trợ scope theo khoa
-- Flyway chạy migration này đúng 1 lần nên không cần IF NOT EXISTS cho FK

ALTER TABLE tin_tuc ADD COLUMN IF NOT EXISTS ma_khoa VARCHAR(20) NULL;

ALTER TABLE tin_tuc
    ADD CONSTRAINT fk_tintuc_khoa
    FOREIGN KEY (ma_khoa) REFERENCES khoa(ma_khoa) ON DELETE SET NULL;
