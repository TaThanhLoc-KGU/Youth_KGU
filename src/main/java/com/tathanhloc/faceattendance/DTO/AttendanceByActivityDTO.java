package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho thống kê điểm danh theo hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceByActivityDTO {
    private String maHoatDong;          // Mã hoạt động
    private String tenHoatDong;         // Tên hoạt động
    private Long tongDangKy;            // Tổng đăng ký
    private Long soLuongCoMat;          // Số lượng có mặt
    private Long soLuongVang;           // Số lượng vắng
    private Double tiLeCoMat;           // Tỷ lệ có mặt (%)
}
