-- V62__system_setting.sql
-- LƯU Ý: Flyway đang tắt (spring.flyway.enabled=false). File này CHỈ để tài liệu.
--
-- Bảng system_setting được Hibernate ddl-auto=update TỰ TẠO từ @Entity SystemSetting.
-- 6 dòng mặc định được DataInitializer.initializeSystemSettings() seed idempotent mỗi lần
-- khởi động (chỉ chèn khoá còn thiếu) — KHÔNG cần chạy tay.
--
-- KILL-SWITCH CHẾ ĐỘ BẢO TRÌ (khi lỡ bật và không vào được trang admin):
--   UPDATE system_setting SET gia_tri='false' WHERE khoa_setting='hethong.bao_tri';
--   -> sau đó RESTART backend (cache RAM nạp lại từ DB; restart trơn không tắt được vì
--      cache vẫn giữ giá trị cũ cho tới khi @PostConstruct chạy lại).

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS system_setting (
    khoa_setting VARCHAR(120) PRIMARY KEY,
    gia_tri      VARCHAR(1000),
    kieu         VARCHAR(16)  NOT NULL DEFAULT 'STRING',
    nhom         VARCHAR(60),
    mo_ta        VARCHAR(255),
    cong_khai    BIT          NOT NULL DEFAULT 0,
    updated_at   DATETIME,
    updated_by   VARCHAR(60)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO system_setting (khoa_setting, gia_tri, kieu, nhom, mo_ta, cong_khai, updated_at, updated_by) VALUES
 ('hoatdong.duyet_doan_khoa_bat_buoc', 'true',  'BOOLEAN', 'HOAT_DONG', 'Bắt buộc Đoàn khoa gửi hoạt động chờ Đoàn trường duyệt (tắt = khoa tự tạo, không cần duyệt)', 1, NOW(), 'system'),
 ('hoatdong.khoa_tu_cong_khai',        'false', 'BOOLEAN', 'HOAT_DONG', 'Cho phép Đoàn khoa tự công khai / ẩn hoạt động của khoa mình', 1, NOW(), 'system'),
 ('tintuc.binh_luan_bat',              'true',  'BOOLEAN', 'TIN_TUC',   'Bật tính năng bình luận trên trang tin tức', 1, NOW(), 'system'),
 ('gopy.bat',                          'true',  'BOOLEAN', 'GOP_Y',     'Mở thùng thư góp ý cho sinh viên gửi phản ánh', 1, NOW(), 'system'),
 ('hethong.bao_tri',                   'false', 'BOOLEAN', 'HE_THONG',  'Chế độ bảo trì — tạm khoá mọi truy cập API của tài khoản không phải admin', 1, NOW(), 'system'),
 ('hethong.bao_tri_thong_bao',         'Hệ thống đang bảo trì, vui lòng quay lại sau.', 'STRING', 'HE_THONG', 'Thông báo hiển thị khi bật chế độ bảo trì', 1, NOW(), 'system');
