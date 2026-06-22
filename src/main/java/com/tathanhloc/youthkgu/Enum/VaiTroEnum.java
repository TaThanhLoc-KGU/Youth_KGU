package com.tathanhloc.youthkgu.Enum;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Vai trò trong hệ thống — 6 cấp phân quyền đa cấp.
 *
 * Hierarchy:
 *   ADMIN → toàn quyền (Đoàn trường)
 *   QUAN_LY_KHOA / PHO_QUAN_LY_KHOA → scope: ma_khoa
 *   QUAN_LY_CHI_DOAN / PHO_CHI_DOAN → scope: ma_lop (Lop.loai = LOP/CHI_DOAN)
 *   DOAN_VIEN → đoàn viên/sinh viên thông thường
 */
public enum VaiTroEnum {
    ADMIN("Quản trị viên"),
    QUAN_LY_KHOA("Bí thư Đoàn khoa"),
    PHO_QUAN_LY_KHOA("Phó bí thư / UV BCH khoa"),
    QUAN_LY_CHI_DOAN("Bí thư chi đoàn"),
    PHO_CHI_DOAN("Phó bí thư / UV chi đoàn"),
    DOAN_VIEN("Đoàn viên"),
    DIEM_DANH_VIEN("Cộng tác viên điểm danh"),
    QUAN_LY_CLB("Chủ nhiệm CLB/Đội/Nhóm");

    private final String tenHienThi;

    VaiTroEnum(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    @JsonValue
    public String getTenHienThi() {
        return name(); // serialize bằng name() không phải label
    }

    public String getLabel() {
        return tenHienThi;
    }

    /** Kiểm tra role có quyền quản trị không (không phải đoàn viên thường) */
    public boolean isQuanLy() {
        return this != DOAN_VIEN;
    }

    /** Kiểm tra role có scope cấp khoa không */
    public boolean isScopedToKhoa() {
        return this == QUAN_LY_KHOA || this == PHO_QUAN_LY_KHOA;
    }

    /** Kiểm tra role có scope cấp chi đoàn không */
    public boolean isScopedToChiDoan() {
        return this == QUAN_LY_CHI_DOAN || this == PHO_CHI_DOAN;
    }

    @JsonCreator
    public static VaiTroEnum fromValue(String value) {
        if (value == null) return DOAN_VIEN;
        String v = value.toUpperCase().trim().replace(" ", "_");
        return switch (v) {
            case "ADMIN", "QUAN_TRI" -> ADMIN;
            case "QUAN_LY_KHOA" -> QUAN_LY_KHOA;
            case "PHO_QUAN_LY_KHOA" -> PHO_QUAN_LY_KHOA;
            case "QUAN_LY_CHI_DOAN" -> QUAN_LY_CHI_DOAN;
            case "PHO_CHI_DOAN" -> PHO_CHI_DOAN;
            case "DIEM_DANH_VIEN" -> DIEM_DANH_VIEN;
            case "QUAN_LY_CLB" -> QUAN_LY_CLB;
            // Legacy values — map sang QUAN_LY_KHOA (cấp cao nhất trong cán bộ)
            case "QUAN_LY", "BCH", "MANAGER", "STAFF" -> QUAN_LY_KHOA;
            // Legacy sinh viên
            case "SINH_VIEN" -> DOAN_VIEN;
            // Legacy GV/CV
            case "GIANG_VIEN", "CHUYEN_VIEN" -> QUAN_LY_KHOA;
            default -> DOAN_VIEN;
        };
    }

    @Deprecated
    public static VaiTroEnum fromName(String name) {
        return fromValue(name);
    }
}
