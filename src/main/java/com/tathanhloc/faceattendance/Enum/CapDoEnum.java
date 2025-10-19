package com.tathanhloc.faceattendance.Enum;

public enum CapDoEnum {
    TRUONG("Trường"),
    KHOA("Khoa"),
    NGANH("Ngành"),
    LOP("Lớp");

    private final String displayName;

    CapDoEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}