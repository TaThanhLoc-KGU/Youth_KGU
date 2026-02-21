package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO cho thống kê số lượng sinh viên
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentCountDTO {
    private Long tongSinhVien;                  // Tổng sinh viên
    private Long sinhVienHoatDong;              // Sinh viên hoạt động
    private Long sinhVienKhongHoatDong;         // Sinh viên không hoạt động
    private Map<String, Long> thongKeTheoKhoa;   // Thống kê theo khoa
    private Map<String, Long> thongKeTheoNganh;  // Thống kê theo ngành
    private Map<String, Long> thongKeTheoLop;    // Thống kê theo lớp
}
