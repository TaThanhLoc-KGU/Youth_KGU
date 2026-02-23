package com.tathanhloc.youthkgu.Enum;

public enum CapDoEnum {
    DOAN_TRUONG("Đoàn trường"),
    HOI_SINH_VIEN("Hội sinh viên"),
    TRUONG("Trường"),
    PHONG("Phòng"),
    KHOA("Khoa"),
    CHI_DOAN("Chi đoàn"),
    TINH_DOAN("Tỉnh đoàn"),
    HOAT_DONG_PHOI_HOP("Hoạt động phối hợp");

    private final String displayName;

    CapDoEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}