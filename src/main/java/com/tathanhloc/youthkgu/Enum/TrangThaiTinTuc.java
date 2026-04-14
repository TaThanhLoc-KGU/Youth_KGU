package com.tathanhloc.youthkgu.Enum;

public enum TrangThaiTinTuc {
    DRAFT("Bản nháp"),
    PUBLISHED("Đã đăng"),
    ARCHIVED("Đã lưu trữ");

    private final String tenHienThi;

    TrangThaiTinTuc(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String getTenHienThi() {
        return tenHienThi;
    }
}
