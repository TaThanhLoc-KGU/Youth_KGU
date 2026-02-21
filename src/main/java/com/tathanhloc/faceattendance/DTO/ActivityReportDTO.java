package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho báo cáo chi tiết hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityReportDTO {
    // Thông tin hoạt động
    private HoatDongDTO hoatDong;

    // Danh sách đăng ký
    private java.util.List<DangKyHoatDongDTO> danhSachDangKy;

    // Danh sách đã check-in
    private java.util.List<DiemDanhHoatDongDTO> danhSachCheckIn;

    // Danh sách chưa check-in
    private java.util.List<java.util.Map<String, Object>> danhSachChuaCheckIn;

    // Thống kê
    private ThongKeHoatDongResponse thongKe;

    // Metadata
    @Builder.Default
    private java.time.LocalDateTime generatedAt = java.time.LocalDateTime.now();
    private String generatedBy; // Mã BCH hoặc admin
}
