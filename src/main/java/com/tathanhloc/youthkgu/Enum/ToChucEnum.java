package com.tathanhloc.youthkgu.Enum;

public enum ToChucEnum {
    DOAN("Đoàn Thanh Niên"),
    HOI("Hội Sinh Viên"),
    BAN_DOI_CLB("Ban - Đội - CLB"),
    CHUNG("Chung");

    private final String tenHienThi;

    ToChucEnum(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String getTenHienThi() {
        return tenHienThi;
    }
}
