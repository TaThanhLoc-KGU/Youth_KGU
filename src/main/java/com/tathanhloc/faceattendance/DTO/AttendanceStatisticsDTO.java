package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO cho thống kê điểm danh tổng hợp
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceStatisticsDTO {
    private Long tongLuotDiemDanh;                      // Tổng lượt điểm danh
    private Long diemDanhThanhCong;                     // Điểm danh thành công
    private Long diemDanhTre;                           // Điểm danh trễ
    private Long vangKhongPhep;                         // Vắng không phép
    private Double tiLeCoMat;                           // Tỷ lệ có mặt (%)
    private Double tiLeDiemDanhTre;                     // Tỷ lệ điểm danh trễ (%)
    private Map<String, Long> thongKeTheoKhoa;         // Thống kê theo khoa
    private Map<String, AttendanceByActivityDTO> thongKeTheoHoatDong;  // Thống kê theo hoạt động
}
