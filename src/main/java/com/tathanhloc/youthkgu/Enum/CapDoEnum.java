package com.tathanhloc.youthkgu.Enum;

public enum CapDoEnum {
    DOAN_TRUONG("Đoàn trường"),
    HOI_SINH_VIEN("Hội sinh viên"),
    TRUONG("Trường"),
    PHONG("Phòng"),
    KHOA("Khoa"),
    CHI_DOAN("Chi đoàn"),
    BAN_DOI_CLB("Ban - Đội - CLB"),
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