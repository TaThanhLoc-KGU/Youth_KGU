package com.tathanhloc.faceattendance.Enum;

public enum LoaiThanhVienEnum {
    SINH_VIEN("Sinh viên"),
    GIANG_VIEN("Giảng viên"),
    CHUYEN_VIEN("Chuyên viên");

    private final String displayName;

    LoaiThanhVienEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}