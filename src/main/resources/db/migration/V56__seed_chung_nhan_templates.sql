-- ============================================================
-- V56: Seed 2 mẫu chứng nhận dựng sẵn (Navy & Gold, Blue Modern)
--
-- LƯU Ý: Flyway đang tắt (spring.flyway.enabled=false) — chạy tay file này (và copy 2 ảnh nền
-- tương ứng vào đúng app.upload.path) nếu muốn có sẵn mẫu ngay, thay vì tự tạo qua trình thiết kế.
--
-- Ảnh nền cần đặt tại (tương ứng app.upload.path/chung-nhan-mau/seed/…):
--   - navy-gold.png    (1400x990px, phong cách trang trọng navy/vàng kim, giống mẫu tham khảo)
--   - blue-modern.png  (1400x990px, phong cách hiện đại, tông xanh indigo của app)
-- 2 file đã được tạo sẵn tại uploads/chung-nhan-mau/seed/ trong lần làm việc này (chạy dev cục bộ
-- ở D:\Youth_KGU thì đã có sẵn do app.upload.path mặc định = ./uploads). Nếu deploy server khác,
-- copy 2 file .png này sang {app.upload.path}/chung-nhan-mau/seed/ trước khi chạy insert bên dưới.
--
-- Sau khi seed, vào trình thiết kế mẫu để: xoá dòng kẻ tên/mã nếu muốn, và GÁN chữ ký thật cho
-- trường "type=signature" (hiện để chuKyId=null vì chữ ký là dữ liệu riêng của từng tài khoản).
-- ============================================================

INSERT INTO `chung_nhan_template` (`ten`, `hinh_nen`, `chieu_rong_px`, `chieu_cao_px`, `fields`, `is_active`)
SELECT * FROM (SELECT
  'Chứng nhận Vinh danh (Navy & Gold)' AS ten,
  '/uploads/chung-nhan-mau/seed/navy-gold.png' AS hinh_nen,
  1400 AS chieu_rong_px, 990 AS chieu_cao_px,
  '[
    {"type":"text","key":"hoTenSinhVien","label":"Họ tên SV","x":350,"y":355,"width":700,"height":100,"fontSizePt":48,"fontName":"montserrat","color":"#132A5E","bold":true,"align":"center"},
    {"type":"text","key":"tenHoatDong","label":"Tên hoạt động","x":350,"y":490,"width":700,"height":60,"fontSizePt":28,"fontName":"montserrat","color":"#7A5C1E","bold":false,"align":"center"},
    {"type":"text","key":"maChungNhan","label":"Mã chứng nhận","x":150,"y":935,"width":250,"height":30,"fontSizePt":16,"fontName":"montserrat","color":"#7A5C1E","bold":false,"align":"left"},
    {"type":"text","key":"ngayCap","label":"Ngày cấp","x":1190,"y":935,"width":180,"height":30,"fontSizePt":18,"fontName":"montserrat","color":"#7A5C1E","bold":false,"align":"left"},
    {"type":"signature","key":null,"label":"Chữ ký","chuKyId":null,"x":580,"y":720,"width":200,"height":95,"fontSizePt":26,"fontName":"montserrat","color":"#1a1a1a","bold":false,"align":"center"},
    {"type":"text","key":null,"label":"Nguyễn Văn A","x":570,"y":838,"width":220,"height":30,"fontSizePt":20,"fontName":"montserrat","color":"#132A5E","bold":true,"align":"center"}
  ]' AS fields,
  1 AS is_active
) t
WHERE NOT EXISTS (SELECT 1 FROM `chung_nhan_template` WHERE `ten` = 'Chứng nhận Vinh danh (Navy & Gold)');

INSERT INTO `chung_nhan_template` (`ten`, `hinh_nen`, `chieu_rong_px`, `chieu_cao_px`, `fields`, `is_active`)
SELECT * FROM (SELECT
  'Chứng nhận Hiện đại (Blue Modern)' AS ten,
  '/uploads/chung-nhan-mau/seed/blue-modern.png' AS hinh_nen,
  1400 AS chieu_rong_px, 990 AS chieu_cao_px,
  '[
    {"type":"text","key":"hoTenSinhVien","label":"Họ tên SV","x":350,"y":380,"width":700,"height":85,"fontSizePt":42,"fontName":"montserrat","color":"#312E81","bold":true,"align":"center"},
    {"type":"text","key":"tenHoatDong","label":"Tên hoạt động","x":350,"y":500,"width":700,"height":55,"fontSizePt":24,"fontName":"montserrat","color":"#6366F1","bold":false,"align":"center"},
    {"type":"text","key":"maChungNhan","label":"Mã chứng nhận","x":155,"y":902,"width":250,"height":28,"fontSizePt":15,"fontName":"montserrat","color":"#818CF8","bold":false,"align":"left"},
    {"type":"text","key":"ngayCap","label":"Ngày cấp","x":1160,"y":902,"width":180,"height":28,"fontSizePt":16,"fontName":"montserrat","color":"#818CF8","bold":false,"align":"left"},
    {"type":"signature","key":null,"label":"Chữ ký","chuKyId":null,"x":600,"y":712,"width":160,"height":85,"fontSizePt":26,"fontName":"montserrat","color":"#1a1a1a","bold":false,"align":"center"},
    {"type":"text","key":null,"label":"Nguyễn Văn A","x":580,"y":822,"width":200,"height":28,"fontSizePt":17,"fontName":"montserrat","color":"#312E81","bold":true,"align":"center"}
  ]' AS fields,
  1 AS is_active
) t
WHERE NOT EXISTS (SELECT 1 FROM `chung_nhan_template` WHERE `ten` = 'Chứng nhận Hiện đại (Blue Modern)');
