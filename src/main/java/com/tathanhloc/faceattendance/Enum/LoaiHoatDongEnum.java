package com.tathanhloc.faceattendance.Enum;

public enum LoaiHoatDongEnum {
    CHINH_TRI("Chính trị"),
    VAN_HOA_NGHE_THUAT("Văn hóa - Nghệ thuật"),
    THE_THAO("Thể thao"),
    TINH_NGUYEN("Tình nguyện"),
    HOC_THUAT("Học thuật"),
    KY_NANG_MEM("Kỹ năng mềm"),
    DOAN_HOI("Đoàn - Hội"),
    CONG_DONG("Cộng đồng"),
    KHAC("Khác");

    private final String displayName;

    LoaiHoatDongEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}