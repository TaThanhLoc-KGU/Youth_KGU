package com.tathanhloc.faceattendance.Enum;

/**
 * ★ MỚI: Enum đánh giá trạng thái check-out
 */
public enum TrangThaiCheckOutEnum {
    HOAN_THANH("Hoàn thành"),
    VE_SOM("Về sớm"),
    CHUA_CHECK_OUT("Chưa check-out");

    private final String displayName;

    TrangThaiCheckOutEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}