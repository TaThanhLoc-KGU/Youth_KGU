-- Tạo bảng taikhoan_permissions (junction table)
CREATE TABLE IF NOT EXISTS taikhoan_permissions (
    taikhoan_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (taikhoan_id, permission_id),
    CONSTRAINT fk_tp_taikhoan FOREIGN KEY (taikhoan_id)
        REFERENCES taikhoan(id) ON DELETE CASCADE,
    CONSTRAINT fk_tp_permission FOREIGN KEY (permission_id)
        REFERENCES permissions(id) ON DELETE CASCADE
);

-- Seed dữ liệu cho bảng permissions (nếu chưa có)
INSERT IGNORE INTO permissions (category, name, description) VALUES
    ('HOAT_DONG', 'VIEW_HOAT_DONG', 'Xem hoạt động'),
    ('HOAT_DONG', 'CREATE_HOAT_DONG', 'Tạo hoạt động'),
    ('HOAT_DONG', 'EDIT_HOAT_DONG', 'Chỉnh sửa hoạt động'),
    ('HOAT_DONG', 'DELETE_HOAT_DONG', 'Xóa hoạt động'),
    ('DIEM_DANH', 'DO_DIEM_DANH', 'Thực hiện điểm danh'),
    ('DIEM_DANH', 'QUET_QR', 'Quét QR check-in/out'),
    ('DIEM_DANH', 'VIEW_DIEM_DANH', 'Xem báo cáo điểm danh'),
    ('SINH_VIEN', 'VIEW_SINH_VIEN', 'Xem danh sách sinh viên'),
    ('SINH_VIEN', 'MANAGE_SINH_VIEN', 'Quản lý sinh viên'),
    ('TAI_KHOAN', 'VIEW_TAI_KHOAN', 'Xem tài khoản'),
    ('TAI_KHOAN', 'APPROVE_TAI_KHOAN', 'Duyệt tài khoản'),
    ('BAO_CAO', 'VIEW_BAO_CAO', 'Xem thống kê/báo cáo'),
    ('BAO_CAO', 'EXPORT_BAO_CAO', 'Xuất báo cáo');
