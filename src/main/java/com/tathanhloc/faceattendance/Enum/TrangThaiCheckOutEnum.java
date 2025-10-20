package com.tathanhloc.faceattendance.Enum;

public enum TrangThaiCheckOutEnum {
    HOAN_THANH("Hoàn thành"),
    VE_SOM_CHAP_NHAN("Về sớm chấp nhận"),
    VE_SOM_QUA_SUA("Về sớm quá sớm");

    private final String displayName;

    TrangThaiCheckOutEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
