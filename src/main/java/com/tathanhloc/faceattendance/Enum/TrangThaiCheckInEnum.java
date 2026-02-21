package com.tathanhloc.faceattendance.Enum;

public enum TrangThaiCheckInEnum {
    DUNG_GIO("Đúng giờ"),
    TRE_CHAP_NHAN("Trễ chấp nhận được"),
    TRE_QUA_GIO("Trễ quá giờ"),
    VE_SOM_QUA_SUA("Về sớm quá sua"),
    VE_SOM_CHAP_NHAN("Về sớm chấp nhận");


    private final String displayName;

    TrangThaiCheckInEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}