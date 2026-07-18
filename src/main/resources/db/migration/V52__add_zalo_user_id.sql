ALTER TABLE sinhvien ADD COLUMN IF NOT EXISTS zalo_user_id VARCHAR(50) NULL;
CREATE INDEX IF NOT EXISTS idx_sv_zalo_user_id ON sinhvien(zalo_user_id);
