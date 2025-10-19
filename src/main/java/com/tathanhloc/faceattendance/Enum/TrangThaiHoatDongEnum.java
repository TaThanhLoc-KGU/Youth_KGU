package com.tathanhloc.faceattendance.Enum;

public enum TrangThaiHoatDongEnum {
    SAP_DIEN_RA("Sắp diễn ra"),
    DANG_DIEN_RA("Đang diễn ra"),
    DA_KET_THUC("Đã kết thúc"),
    HUY_BO("Hủy bỏ");

    private final String displayName;

    TrangThaiHoatDongEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}