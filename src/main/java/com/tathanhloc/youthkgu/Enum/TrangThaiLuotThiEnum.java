package com.tathanhloc.youthkgu.Enum;

/** Trạng thái một lượt làm bài. */
public enum TrangThaiLuotThiEnum {
    DANG_LAM("Đang làm"),
    DA_NOP("Đã nộp"),
    TU_DONG_NOP("Tự động nộp (hết giờ)");

    private final String tenHienThi;
    TrangThaiLuotThiEnum(String t) { this.tenHienThi = t; }
    public String getTenHienThi() { return tenHienThi; }
}
