package com.tathanhloc.youthkgu.Enum;

/** Thời điểm cho thí sinh xem điểm / đáp án. */
public enum CheDoHienKetQuaEnum {
    NGAY("Ngay sau khi nộp"),
    SAU_KHI_DONG("Sau khi đề đóng"),
    KHONG("Không hiển thị");

    private final String tenHienThi;
    CheDoHienKetQuaEnum(String t) { this.tenHienThi = t; }
    public String getTenHienThi() { return tenHienThi; }
}
