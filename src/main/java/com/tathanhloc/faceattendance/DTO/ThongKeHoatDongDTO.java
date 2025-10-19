package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO cho thống kê hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThongKeHoatDongDTO {
    private String maHoatDong;
    private String tenHoatDong;
    private String loaiHoatDong;
    private LocalDate ngayToChuc;

    // Số liệu đăng ký
    private Integer tongDangKy;
    private Integer soChoConLai;

    // Số liệu điểm danh
    private Integer daThamGia;
    private Integer vangMat;
    private Integer chuaDiemDanh;

    // Tỷ lệ
    private Double tyLeDangKy; // % so với số chỗ
    private Double tyLeThamGia; // % so với đăng ký

    // QR Code statistics
    private Integer soQRDaSinh;
    private Integer soQRDaQuet;
    private Integer soQRChuaQuet;
}