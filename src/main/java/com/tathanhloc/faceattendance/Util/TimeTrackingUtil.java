package com.tathanhloc.faceattendance.Util;

import com.tathanhloc.faceattendance.Enum.TrangThaiCheckInEnum;
import com.tathanhloc.faceattendance.Enum.TrangThaiCheckOutEnum;
import com.tathanhloc.faceattendance.Model.HoatDong;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Utility class for time tracking and validation
 */
public class TimeTrackingUtil {

    /**
     * Tính trạng thái check-in (đúng giờ/trễ)
     */
    public static TrangThaiCheckInEnum calculateCheckInStatus(HoatDong hoatDong, LocalDateTime checkInTime) {
        if (hoatDong.getThoiGianBatDau() == null) {
            return TrangThaiCheckInEnum.DUNG_GIO; // Default nếu không set thời gian
        }

        LocalTime checkInLocalTime = checkInTime.toLocalTime();
        LocalTime startTime = hoatDong.getThoiGianBatDau();
        int maxLateMinutes = hoatDong.getThoiGianTreToiDa() != null ?
                hoatDong.getThoiGianTreToiDa() : 0;

        // Tính số phút trễ
        long minutesLate = Duration.between(startTime, checkInLocalTime).toMinutes();

        if (minutesLate <= 0) {
            return TrangThaiCheckInEnum.DUNG_GIO;
        } else if (minutesLate <= maxLateMinutes) {
            return TrangThaiCheckInEnum.TRE_CHAP_NHAN;
        } else {
            return TrangThaiCheckInEnum.TRE_QUA_GIO;
        }
    }

    /**
     * Tính số phút trễ
     */
    public static Integer calculateLateMinutes(HoatDong hoatDong, LocalDateTime checkInTime) {
        if (hoatDong.getThoiGianBatDau() == null) {
            return 0;
        }

        LocalTime checkInLocalTime = checkInTime.toLocalTime();
        LocalTime startTime = hoatDong.getThoiGianBatDau();
        int maxLateMinutes = hoatDong.getThoiGianTreToiDa() != null ?
                hoatDong.getThoiGianTreToiDa() : 0;

        long minutesLate = Duration.between(startTime, checkInLocalTime).toMinutes();

        return minutesLate > 0 ? (int) minutesLate : 0;
    }

    /**
     * Tính trạng thái check-out (hoàn thành/về sớm)
     */
    public static TrangThaiCheckOutEnum calculateCheckOutStatus(HoatDong hoatDong, LocalDateTime checkOutTime) {
        if (hoatDong.getThoiGianKetThuc() == null) {
            return TrangThaiCheckOutEnum.HOAN_THANH; // Default
        }

        LocalTime checkOutLocalTime = checkOutTime.toLocalTime();
        LocalTime endTime = hoatDong.getThoiGianKetThuc();

        long minutesEarly = Duration.between(checkOutLocalTime, endTime).toMinutes();

        if (minutesEarly <= 0) {
            return TrangThaiCheckOutEnum.HOAN_THANH;
        } else if (minutesEarly <= 30) {
            return TrangThaiCheckOutEnum.VE_SOM_CHAP_NHAN;
        } else {
            return TrangThaiCheckOutEnum.VE_SOM_QUA_SUA;
        }
    }

    /**
     * Tính số phút về sớm
     */
    public static Integer calculateEarlyMinutes(HoatDong hoatDong, LocalDateTime checkOutTime) {
        if (hoatDong.getThoiGianKetThuc() == null) {
            return 0;
        }

        LocalTime checkOutLocalTime = checkOutTime.toLocalTime();
        LocalTime endTime = hoatDong.getThoiGianKetThuc();

        long minutesEarly = Duration.between(checkOutLocalTime, endTime).toMinutes();

        return minutesEarly > 0 ? (int) minutesEarly : 0;
    }

    /**
     * Tính tổng thời gian tham gia (phút)
     */
    public static Integer calculateTotalParticipationTime(LocalDateTime checkIn, LocalDateTime checkOut) {
        if (checkIn == null || checkOut == null) {
            return 0;
        }

        return (int) Duration.between(checkIn, checkOut).toMinutes();
    }

    /**
     * Kiểm tra có đủ thời gian tối thiểu không
     */
    public static Boolean isMinimumTimeMet(HoatDong hoatDong, Integer totalMinutes) {
        if (hoatDong.getThoiGianToiThieu() == null || totalMinutes == null) {
            return true; // Default true nếu không set yêu cầu
        }

        return totalMinutes >= hoatDong.getThoiGianToiThieu();
    }

    /**
     * Kiểm tra có được tính giờ phục vụ cộng đồng không
     */
    public static Boolean shouldCountCommunityServiceHours(
            HoatDong hoatDong,
            TrangThaiCheckInEnum checkInStatus,
            TrangThaiCheckOutEnum checkOutStatus,
            Integer totalMinutes
    ) {
        // Điều kiện để tính giờ phục vụ:
        // 1. Check-in không quá trễ
        // 2. Check-out không về sớm quá sớm
        // 3. Đủ thời gian tối thiểu

        boolean validCheckIn = checkInStatus != TrangThaiCheckInEnum.TRE_QUA_GIO;
        boolean validCheckOut = checkOutStatus != TrangThaiCheckOutEnum.VE_SOM_QUA_SUA;
        boolean metMinimumTime = isMinimumTimeMet(hoatDong, totalMinutes);

        return validCheckIn && validCheckOut && metMinimumTime;
    }
}
