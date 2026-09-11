package com.tathanhloc.youthkgu.Enum;

/** Vòng đời của đề thi. */
public enum TrangThaiDeThiEnum {
    NHAP("Nháp"),
    DA_XUAT_BAN("Đã xuất bản"),
    DONG("Đã đóng");

    private final String tenHienThi;
    TrangThaiDeThiEnum(String t) { this.tenHienThi = t; }
    public String getTenHienThi() { return tenHienThi; }
}
