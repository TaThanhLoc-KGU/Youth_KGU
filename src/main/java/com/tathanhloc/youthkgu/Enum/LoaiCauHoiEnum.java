package com.tathanhloc.youthkgu.Enum;

/** Loại câu hỏi trắc nghiệm. */
public enum LoaiCauHoiEnum {
    MOT_DAP_AN("Một đáp án đúng"),
    NHIEU_DAP_AN("Nhiều đáp án đúng"),
    DUNG_SAI("Đúng / Sai");

    private final String tenHienThi;
    LoaiCauHoiEnum(String t) { this.tenHienThi = t; }
    public String getTenHienThi() { return tenHienThi; }
}
