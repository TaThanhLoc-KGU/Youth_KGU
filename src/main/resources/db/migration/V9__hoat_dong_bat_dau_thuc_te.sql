-- V9: Thêm cột thời gian bắt đầu thực tế cho hoạt động
-- Dùng để ghi lại khi nào BCH thực sự bấm "Bắt đầu hoạt động"
ALTER TABLE hoat_dong
    ADD COLUMN thoi_gian_bat_dau_thuc_te DATETIME(6) DEFAULT NULL
        COMMENT 'Thời điểm BCH/Admin bấm Bắt đầu (thực tế), khác với thoi_gian_bat_dau (lịch dự kiến)';

-- Cột lưu trạng thái trước khi bắt đầu (phục vụ revert nếu lỡ tay)
ALTER TABLE hoat_dong
    ADD COLUMN trang_thai_truoc_khi_bat_dau VARCHAR(50) DEFAULT NULL
        COMMENT 'Trạng thái trước khi startActivity() được gọi — dùng để revert nếu lỡ tay';
