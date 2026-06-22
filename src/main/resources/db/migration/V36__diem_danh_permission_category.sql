-- V36: Nhóm quyền ĐIỂM DANH
-- Gom tất cả quyền liên quan điểm danh vào category DIEM_DANH
-- để hiển thị rõ ràng trong Permission Matrix và dễ gán cho đội điểm danh.

UPDATE `permissions`
SET `category` = 'DIEM_DANH'
WHERE `name` IN (
    'QUET_QR',
    'GIAO_DIEM_DANH',
    'XEM_DIEM_DANH',
    'XUAT_DS_DIEM_DANH',
    'XUAT_DS_DANG_KY'
);
