package com.tathanhloc.youthkgu.Enum;

/** Mức độ khó của câu hỏi — dùng cho ma trận đề ngẫu nhiên. */
public enum DoKhoCauHoiEnum {
    DE("Dễ"),
    TRUNG_BINH("Trung bình"),
    KHO("Khó");

    private final String tenHienThi;
    DoKhoCauHoiEnum(String t) { this.tenHienThi = t; }
    public String getTenHienThi() { return tenHienThi; }
}
