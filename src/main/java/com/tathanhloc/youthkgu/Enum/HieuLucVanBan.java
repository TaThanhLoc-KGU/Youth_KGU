package com.tathanhloc.youthkgu.Enum;

public enum HieuLucVanBan {
    CON_HIEU_LUC("Còn hiệu lực"),
    HET_HIEU_LUC("Hết hiệu lực"),
    CHUA_HIEU_LUC("Chưa hiệu lực");

    private final String tenHienThi;

    HieuLucVanBan(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String getTenHienThi() {
        return tenHienThi;
    }
}
