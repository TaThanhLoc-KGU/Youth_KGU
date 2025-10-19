package com.tathanhloc.faceattendance.Enum;

/**
 * ★ MỚI: Enum đánh giá trạng thái check-in
 */
public enum TrangThaiCheckInEnum {
    DUNG_GIO("Đúng giờ"),
    TRE("Trễ"),
    CHUA_CHECK_IN("Chưa check-in");

    private final String displayName;

    TrangThaiCheckInEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}