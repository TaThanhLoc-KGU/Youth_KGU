package com.tathanhloc.youthkgu.Enum;

public enum CheDoDiemDanhEnum {

    CHECKIN_CHECKOUT("Check-in & Check-out"),
    CHECKOUT_ONLY("Chỉ Check-out (không cần check-in)"),
    CHECKIN_ONLY("Chỉ Check-in (không cần check-out)"),
    AUTO_FULL("Tự động — toàn bộ đăng ký = đã tham gia");

    private final String displayName;

    CheDoDiemDanhEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
