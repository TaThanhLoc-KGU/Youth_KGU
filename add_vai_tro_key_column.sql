-- Migration: Add vai_tro_key column to chuc_vu table
-- Thêm cột vai_tro_key vào bảng chuc_vu để định nghĩa vai trò linh hoạt

ALTER TABLE chuc_vu ADD COLUMN vai_tro_key VARCHAR(50);

-- Cập nhật các vai trò hiện tại dựa trên mã chức vụ
UPDATE chuc_vu SET vai_tro_key = 'BI_THU_DOAN' WHERE ma_chuc_vu = 'CV001';
UPDATE chuc_vu SET vai_tro_key = 'PHO_BI_THU_DOAN' WHERE ma_chuc_vu = 'CV002';
UPDATE chuc_vu SET vai_tro_key = 'UY_VIEN_THUONG_VU_DOAN' WHERE ma_chuc_vu = 'CV003';
UPDATE chuc_vu SET vai_tro_key = 'UY_VIEN_CHAP_HANH_DOAN' WHERE ma_chuc_vu = 'CV004';
UPDATE chuc_vu SET vai_tro_key = 'CAN_BO_VAN_PHONG_DOAN' WHERE ma_chuc_vu = 'CV005';
UPDATE chuc_vu SET vai_tro_key = 'THU_KY_HANH_CHINH_DOAN' WHERE ma_chuc_vu = 'CV006';
UPDATE chuc_vu SET vai_tro_key = 'CHU_TICH_HOI' WHERE ma_chuc_vu = 'CV011';
UPDATE chuc_vu SET vai_tro_key = 'PHO_CHU_TICH_HOI' WHERE ma_chuc_vu = 'CV012';
UPDATE chuc_vu SET vai_tro_key = 'UY_VIEN_THU_KY_HOI' WHERE ma_chuc_vu = 'CV013';
UPDATE chuc_vu SET vai_tro_key = 'UY_VIEN_CHAP_HANH_HOI' WHERE ma_chuc_vu = 'CV014';
UPDATE chuc_vu SET vai_tro_key = 'TRUONG_BAN_DOAN' WHERE ma_chuc_vu = 'CV021';
UPDATE chuc_vu SET vai_tro_key = 'PHO_TRUONG_BAN_DOAN' WHERE ma_chuc_vu = 'CV022';
UPDATE chuc_vu SET vai_tro_key = 'UV_BAN_DOAN' WHERE ma_chuc_vu = 'CV023';
UPDATE chuc_vu SET vai_tro_key = 'TRUONG_BAN_HOI' WHERE ma_chuc_vu = 'CV031';
UPDATE chuc_vu SET vai_tro_key = 'PHO_TRUONG_BAN_HOI' WHERE ma_chuc_vu = 'CV032';
UPDATE chuc_vu SET vai_tro_key = 'UV_BAN_HOI' WHERE ma_chuc_vu = 'CV033';

-- Cập nhật các chức vụ khác thành vai trò mặc định (THANH_VIEN_DOAN hoặc THANH_VIEN_HOI)
UPDATE chuc_vu SET vai_tro_key = CASE 
    WHEN thuoc_ban = 'DOAN' THEN 'THANH_VIEN_DOAN'
    WHEN thuoc_ban = 'HOI' THEN 'THANH_VIEN_HOI'
    ELSE 'THANH_VIEN_DOAN'
END
WHERE vai_tro_key IS NULL;

-- Thêm constraint NOT NULL (tuỳ chọn)
-- ALTER TABLE chuc_vu MODIFY vai_tro_key VARCHAR(50) NOT NULL;
