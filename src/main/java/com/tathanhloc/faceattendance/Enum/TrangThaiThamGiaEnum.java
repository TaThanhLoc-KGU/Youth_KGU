package com.tathanhloc.faceattendance.Enum;

import lombok.Getter;

@Getter
public enum TrangThaiThamGiaEnum {
    DA_THAM_GIA("Đã tham gia"),
    VANG_MAT("Vắng"),
    DANG_KY("Đăng ký"),
    HUY("Hủy");

    private final String value;

    TrangThaiThamGiaEnum(String value) {
        this.value = value;
    }

    public static TrangThaiThamGiaEnum fromValue(String value) {
        for (TrangThaiThamGiaEnum trangThai : TrangThaiThamGiaEnum.values()) {
            if (trangThai.getValue().equals(value)) {
                return trangThai;
            }
        }
        throw new IllegalArgumentException("Giá trị không hợp lệ: " + value);
    }
}
