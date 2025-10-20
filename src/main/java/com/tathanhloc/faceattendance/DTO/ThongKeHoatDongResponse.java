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
public class ThongKeHoatDongResponse {
    // Thông tin cơ bản
    private String maHoatDong;
    private String tenHoatDong;
    private java.time.LocalDate ngayToChuc;
    private String trangThai;

    // Số liệu đăng ký
    private Long tongDangKy;
    private Long daXacNhan;
    private Long choXacNhan;
    private Long conTrong;
    private Integer soLuongToiDa;

    // Số liệu tham gia
    private Long daCheckIn;
    private Long chuaCheckIn;
    private Long daThamGia;
    private Long vangMat;

    // Tỷ lệ phần trăm
    private Double tyLeDangKy; // % đăng ký / tối đa
    private Double tyLeCheckIn; // % check-in / đăng ký
    private Double tyLeThamGia; // % tham gia / đăng ký

    // Metadata
    @Builder.Default
    private java.time.LocalDateTime timestamp = java.time.LocalDateTime.now();
}