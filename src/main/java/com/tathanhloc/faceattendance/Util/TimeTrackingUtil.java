package com.tathanhloc.faceattendance.Util;

import com.tathanhloc.faceattendance.Enum.TrangThaiCheckInEnum;
import com.tathanhloc.faceattendance.Enum.TrangThaiCheckOutEnum;
import com.tathanhloc.faceattendance.Model.HoatDong;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * ★ MỚI: Utility để tính toán thời gian check-in/check-out
 */
public class TimeTrackingUtil {

    /**
     * Tính trạng thái check-in
     */
    public static TrangThaiCheckInEnum calculateCheckInStatus(
            LocalDateTime checkInTime,
            HoatDong hoatDong) {

        if (checkInTime == null || hoatDong == null || hoatDong.getThoiGianBatDau() == null) {
            return TrangThaiCheckInEnum.CHUA_CHECK_IN;
        }

        LocalDateTime gioTreToiDa = hoatDong.getThoiGianBatDau()
                .plusMinutes(hoatDong.getThoiGianTreToiDa());

        return checkInTime.isAfter(gioTreToiDa)
                ? TrangThaiCheckInEnum.TRE
                : TrangThaiCheckInEnum.DUNG_GIO;
    }

    /**
     * Tính số phút trễ
     */
    public static int calculateLateMinutes(LocalDateTime checkInTime, HoatDong hoatDong) {
        if (checkInTime == null || hoatDong == null) {
            return 0;
        }

        LocalDateTime gioTreToiDa = hoatDong.getThoiGianBatDau()
                .plusMinutes(hoatDong.getThoiGianTreToiDa());

        if (checkInTime.isAfter(gioTreToiDa)) {
            return (int) Duration.between(gioTreToiDa, checkInTime).toMinutes();
        }

        return 0;
    }

    /**
     * Tính trạng thái check-out
     */
    public static TrangThaiCheckOutEnum calculateCheckOutStatus(
            LocalDateTime checkOutTime,
            HoatDong hoatDong) {

        if (checkOutTime == null) {
            return TrangThaiCheckOutEnum.CHUA_CHECK_OUT;
        }

        if (hoatDong == null || hoatDong.getThoiGianKetThuc() == null) {
            return TrangThaiCheckOutEnum.HOAN_THANH;
        }

        return checkOutTime.isBefore(hoatDong.getThoiGianKetThuc())
                ? TrangThaiCheckOutEnum.VE_SOM
                : TrangThaiCheckOutEnum.HOAN_THANH;
    }

    /**
     * Tính tổng thời gian tham gia (phút)
     */
    public static int calculateTotalMinutes(LocalDateTime checkIn, LocalDateTime checkOut) {
        if (checkIn == null || checkOut == null) {
            return 0;
        }

        return (int) Duration.between(checkIn, checkOut).toMinutes();
    }

    /**
     * Tính tổng thời gian tham gia (giờ)
     */
    public static double calculateTotalHours(LocalDateTime checkIn, LocalDateTime checkOut) {
        return calculateTotalMinutes(checkIn, checkOut) / 60.0;
    }

    /**
     * Check có đủ thời gian tối thiểu không
     */
    public static boolean meetsMinimumTime(int totalMinutes, Integer requiredMinutes) {
        if (requiredMinutes == null) {
            return true;
        }
        return totalMinutes >= requiredMinutes;
    }
}