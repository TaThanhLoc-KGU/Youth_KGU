package com.tathanhloc.faceattendance.Enum;

public enum LoaiBanEnum {
    DOAN("Đoàn"),
    HOI("Hội"),
    DOI_CLB_BAN("Đội/CLB/Ban");

    private final String label;

    LoaiBanEnum(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}