-- Thêm mã tham chiếu duy nhất cho mỗi bản ghi phí CLB
-- Dùng để khớp nội dung chuyển khoản với bản ghi trong DB
ALTER TABLE dong_phi_clb
    ADD COLUMN ma_reference VARCHAR(50) NULL COMMENT 'Mã tham chiếu CK: PHI{maSv} hoặc tùy chỉnh' AFTER ghi_chu,
    ADD UNIQUE INDEX uq_dong_phi_reference (ma_reference);
