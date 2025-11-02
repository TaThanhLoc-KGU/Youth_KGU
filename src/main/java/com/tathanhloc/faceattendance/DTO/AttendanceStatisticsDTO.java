// AttendanceStatisticsDTO.java
package com.tathanhloc.faceattendance.DTO;

import lombok.*;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceStatisticsDTO {
    private Long tongLuotDiemDanh;
    private Long diemDanhThanhCong;
    private Long diemDanhTre;
    private Long vangKhongPhep;
    private Double tiLeCoMat;
    private Double tiLeDiemDanhTre;

    // Thống kê theo khoa
    private Map<String, Long> thongKeTheoKhoa;

    // Thống kê theo hoạt động
    private Map<String, AttendanceByActivityDTO> thongKeTheoHoatDong;
}