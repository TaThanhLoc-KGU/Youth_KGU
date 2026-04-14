package com.tathanhloc.youthkgu.Enum;

public enum TrangThaiVanBan {
    DRAFT("Bản nháp"),
    PUBLISHED("Đã ban hành"),
    ARCHIVED("Đã lưu trữ");

    private final String tenHienThi;

    TrangThaiVanBan(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String getTenHienThi() {
        return tenHienThi;
    }
}
