package com.tathanhloc.faceattendance.Util;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Tiện ích tự động tính Học kỳ và Năm học dựa theo lịch học của trường KGU.
 *
 * Lịch học kỳ:
 *  - HK1: từ đầu tháng 8 → hết tháng 11     (15 tuần: 14 tuần học+thi, 1 tuần nghỉ)
 *  - HK2: từ đầu tháng 12 → giữa tháng 3    (17 tuần: thêm 2 tuần nghỉ lễ Tết)
 *  - HK3: từ giữa tháng 3 → hết tháng 6     (14 tuần: 13 tuần học+thi)
 *  - Nghỉ hè: tháng 7 → đầu tháng 8         (~5-6 tuần, thuộc phần cuối năm học)
 *
 * Năm học: nếu tháng >= 8 → năm học là (năm)-(năm+1), ngược lại là (năm-1)-(năm)
 */
public class AcademicCalendarUtil {

    // Ngưỡng ngày trong tháng 3 để phân biệt HK2 và HK3
    private static final int NGAY_CHUYEN_TIEP_THANG_3 = 15;

    private AcademicCalendarUtil() {
        // Utility class, không khởi tạo
    }

    /**
     * Tính số học kỳ hiện tại (1, 2 hoặc 3) theo ngày đầu vào.
     */
    public static int getSoHocKy(LocalDate date) {
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();

        if (month >= 8 && month <= 11) {
            return 1; // HK1: tháng 8 - 11
        } else if (month == 12 || month == 1 || month == 2
                || (month == 3 && day < NGAY_CHUYEN_TIEP_THANG_3)) {
            return 2; // HK2: tháng 12 - giữa tháng 3
        } else if ((month == 3 && day >= NGAY_CHUYEN_TIEP_THANG_3)
                || (month >= 4 && month <= 6)) {
            return 3; // HK3: giữa tháng 3 - tháng 6
        } else {
            // Tháng 7: nghỉ hè sau HK3, vẫn tính là HK3 của năm học đó
            return 3;
        }
    }

    /**
     * Tính số học kỳ hiện tại theo ngày hôm nay.
     */
    public static int getCurrentSoHocKy() {
        return getSoHocKy(LocalDate.now());
    }

    /**
     * Tính mã năm học (định dạng: "2025-2026") dựa theo ngày đầu vào.
     */
    public static String getNamHocCode(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();

        if (month >= 8) {
            return year + "-" + (year + 1);
        } else {
            return (year - 1) + "-" + year;
        }
    }

    /**
     * Tính mã năm học hiện tại theo ngày hôm nay.
     */
    public static String getCurrentNamHocCode() {
        return getNamHocCode(LocalDate.now());
    }

    /**
     * Tính mã primary key của NamHoc (định dạng: "NH2025-2026").
     */
    public static String getMaNamHoc(LocalDate date) {
        return "NH" + getNamHocCode(date);
    }

    /**
     * Tính mã primary key của NamHoc hiện tại.
     */
    public static String getCurrentMaNamHoc() {
        return getMaNamHoc(LocalDate.now());
    }

    /**
     * Trả về thông tin học kỳ và năm học hiện tại dưới dạng Map.
     */
    public static Map<String, Object> getCurrentAcademicInfo() {
        return getAcademicInfo(LocalDate.now());
    }

    /**
     * Trả về thông tin học kỳ và năm học cho một ngày cụ thể.
     */
    public static Map<String, Object> getAcademicInfo(LocalDate date) {
        int soHocKy = getSoHocKy(date);
        String namHocCode = getNamHocCode(date);
        String maNamHoc = getMaNamHoc(date);

        Map<String, Object> info = new HashMap<>();
        info.put("soHocKy", soHocKy);
        info.put("tenHocKy", "Học kỳ " + soHocKy);
        info.put("namHocCode", namHocCode);
        info.put("tenNamHoc", "Năm học " + namHocCode);
        info.put("maNamHoc", maNamHoc);
        return info;
    }

    /**
     * Tính ngày bắt đầu HK1 của một năm học (đầu tháng 8).
     */
    public static LocalDate getNgayBatDauHK1(int startYear) {
        return LocalDate.of(startYear, 8, 4); // Tuần đầu tiên tháng 8
    }

    /**
     * Tính ngày kết thúc HK1 (sau 15 tuần = 105 ngày từ đầu tháng 8).
     */
    public static LocalDate getNgayKetThucHK1(int startYear) {
        return getNgayBatDauHK1(startYear).plusWeeks(15);
    }

    /**
     * Tính ngày bắt đầu HK2 (đầu tháng 12).
     */
    public static LocalDate getNgayBatDauHK2(int startYear) {
        return LocalDate.of(startYear, 12, 1);
    }

    /**
     * Tính ngày kết thúc HK2 (sau 17 tuần = 119 ngày từ đầu tháng 12).
     */
    public static LocalDate getNgayKetThucHK2(int startYear) {
        return getNgayBatDauHK2(startYear).plusWeeks(17);
    }

    /**
     * Tính ngày bắt đầu HK3 (giữa tháng 3 năm sau).
     */
    public static LocalDate getNgayBatDauHK3(int startYear) {
        return LocalDate.of(startYear + 1, 3, NGAY_CHUYEN_TIEP_THANG_3);
    }

    /**
     * Tính ngày kết thúc HK3 (sau 14 tuần = 98 ngày).
     */
    public static LocalDate getNgayKetThucHK3(int startYear) {
        return getNgayBatDauHK3(startYear).plusWeeks(14);
    }
}
