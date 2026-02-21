package com.tathanhloc.faceattendance.Enum;

public enum ThuocBanEnum {
    DOAN("Đoàn"),
    HOI("Hội"), 
    BAN_PHUC_VU("Ban phục vụ");

    private final String label;

    ThuocBanEnum(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}