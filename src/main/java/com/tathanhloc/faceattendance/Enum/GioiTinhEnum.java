package com.tathanhloc.faceattendance.Enum;

import lombok.Getter;

@Getter
public enum GioiTinhEnum {
    NAM("Nam"),
    NU("Nữ");

    private final String value;

    GioiTinhEnum(String value) {
        this.value = value;
    }

    public static GioiTinhEnum fromValue(String value) {
        for (GioiTinhEnum gioiTinh : GioiTinhEnum.values()) {
            if (gioiTinh.getValue().equals(value)) {
                return gioiTinh;
            }
        }
        throw new IllegalArgumentException("Giá trị không hợp lệ: " + value);
    }
}
