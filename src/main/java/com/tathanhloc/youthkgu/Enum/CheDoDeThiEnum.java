package com.tathanhloc.youthkgu.Enum;

/** Chế độ sinh đề của một đề thi trắc nghiệm. */
public enum CheDoDeThiEnum {
    CO_DINH("Đề cố định"),
    NGAU_NHIEN("Đề ngẫu nhiên (ma trận)");

    private final String tenHienThi;
    CheDoDeThiEnum(String t) { this.tenHienThi = t; }
    public String getTenHienThi() { return tenHienThi; }
}
