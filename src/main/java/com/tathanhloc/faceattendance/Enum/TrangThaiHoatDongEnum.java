package com.tathanhloc.faceattendance.Enum;

public enum TrangThaiHoatDongEnum {
    SAP_DIEN_RA("Sắp diễn ra"),
    DANG_MO_DANG_KY("Đang mở đăng ký"),
    DANG_DIEN_RA("Đang diễn ra"),
    DA_HOAN_THANH("Đã hoàn thành"),
    DA_HUY("Đã hủy");

    private final String displayName;

    TrangThaiHoatDongEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}