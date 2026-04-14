-- V7: Add ma_sv to thi_sinh for checkout feature
ALTER TABLE thi_sinh ADD COLUMN ma_sv VARCHAR(20) NULL;
ALTER TABLE thi_sinh ADD CONSTRAINT fk_thi_sinh_sinh_vien
    FOREIGN KEY (ma_sv) REFERENCES sinhvien(ma_sv) ON DELETE SET NULL;
CREATE INDEX idx_ts_ma_sv ON thi_sinh(ma_sv);
