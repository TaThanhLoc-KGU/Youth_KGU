package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO cho thống kê dashboard tổng quan
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    // Tổng quan hoạt động
    private Integer tongHoatDong;
    private Integer hoatDongSapDienRa;
    private Integer hoatDongDangDienRa;
    private Integer hoatDongDaKetThuc;

    // Tổng quan sinh viên
    private Integer tongSinhVien;
    private Integer sinhVienThamGiaHoatDong;

    // Tổng quan đăng ký
    private Integer tongDangKy;
    private Integer tongDiemDanh;
    private Double tyLeThamGia;

    // QR Code stats
    private Integer tongQRDaSinh;
    private Integer tongQRDaQuet;

    // Điểm rèn luyện
    private Long tongDiemRenLuyen;

    // Thống kê theo loại
    private Map<String, Integer> thongKeTheoLoai;

    // Top hoạt động
    private HoatDongDTO hoatDongSapToiGanNhat;
    private HoatDongDTO hoatDongNhieuNguoiNhat;
}