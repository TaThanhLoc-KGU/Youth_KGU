-- BCN CLB: mở rộng để GiangVien và ChuyenVien có thể là thành viên BCN
-- Thêm loai_nguoi, ma_gv, ma_cv; cho phép ma_sv nullable

ALTER TABLE ban_chu_nhiem_clb
    MODIFY COLUMN ma_sv VARCHAR(50) NULL,
    ADD COLUMN loai_nguoi VARCHAR(5)  NOT NULL DEFAULT 'SV' AFTER ma_sv,
    ADD COLUMN ma_gv      VARCHAR(50) NULL AFTER loai_nguoi,
    ADD COLUMN ma_cv      VARCHAR(50) NULL AFTER ma_gv;

-- Xóa unique constraint cũ (chỉ theo ma_sv)
ALTER TABLE ban_chu_nhiem_clb DROP INDEX uq_bcn_sv_clb_nhiem_ky;
