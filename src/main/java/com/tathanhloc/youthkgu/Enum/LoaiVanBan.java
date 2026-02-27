package com.tathanhloc.youthkgu.Enum;

public enum LoaiVanBan {
    KE_HOACH("Kế hoạch"),
    CONG_VAN("Công văn"),
    QUYET_DINH("Quyết định"),
    THONG_BAO("Thông báo"),
    BAO_CAO("Báo cáo"),
    HUONG_DAN("Hướng dẫn"),
    BIEN_BAN("Biên bản"),
    TO_TRINH("Tờ trình"),
    KHAC("Khác");

    private final String tenHienThi;

    LoaiVanBan(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String getTenHienThi() {
        return tenHienThi;
    }
}
