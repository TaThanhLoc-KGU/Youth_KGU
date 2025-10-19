package com.tathanhloc.faceattendance.Enum;

public enum TrangThaiThamGiaEnum {
    DANG_KY("Đã đăng ký"),
    DA_THAM_GIA("Đã tham gia"),
    VANG_MAT("Vắng mặt"),
    HUY_DANG_KY("Hủy đăng ký");

    private final String displayName;

    TrangThaiThamGiaEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}