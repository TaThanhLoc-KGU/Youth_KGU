package com.tathanhloc.youthkgu.Enum;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * Loại tài khoản trong hệ thống — chỉ còn 2 loại.
 * SINH_VIEN: sinh viên thường, chỉ có quyền cơ bản.
 * QUAN_LY:   cán bộ/quản lý, quyền cụ thể gán qua bảng tai_khoan_quyen.
 *            Nếu la_admin=true trên TaiKhoan → toàn quyền.
 */
public enum VaiTroEnum {
    SINH_VIEN("Sinh viên"),
    QUAN_LY("Quản lý");

    private final String tenHienThi;

    VaiTroEnum(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String getTenHienThi() {
        return tenHienThi;
    }

    @JsonCreator
    public static VaiTroEnum fromValue(String value) {
        if (value == null) return SINH_VIEN;
        String normalized = value.toUpperCase().trim().replace(" ", "_");
        // Mọi vai trò quản lý cũ đều map về QUAN_LY
        if (normalized.equals("QUAN_LY") || normalized.equals("ADMIN")
                || normalized.equals("BCH") || normalized.equals("GIANG_VIEN")
                || normalized.equals("CHUYEN_VIEN") || normalized.equals("MANAGER")
                || normalized.equals("STAFF") || normalized.equals("QUAN_TRI")) {
            return QUAN_LY;
        }
        return SINH_VIEN;
    }

    @Deprecated
    public static VaiTroEnum fromName(String name) {
        return fromValue(name);
    }
}
