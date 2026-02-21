package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho thống kê hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityStatisticsResponse {
    private HoatDongDTO hoatDong;

    // Đăng ký
    private Long soDangKy;
    private Long daXacNhan;
    private Long choXacNhan;

    // Điểm danh
    private Long daCheckIn;
    private Long chuaCheckIn;
    private Long daThamGia;

    // Tỷ lệ
    private Double tyLeCheckIn;
    private Double tyLeThamGia;

    // Capacity
    private Integer soLuongToiDa;
    private Long conTrong;
}
