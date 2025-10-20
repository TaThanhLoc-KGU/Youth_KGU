package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho dashboard tổng quan
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    // Tổng quan hệ thống
    private Long tongHoatDong;
    private Long hoatDongDangDienRa;
    private Long hoatDongSapDienRa;
    private Long hoatDongDaHoanThanh;

    // Sinh viên
    private Long tongSinhVienThamGia;
    private Long sinhVienHoatDongTrongThang;

    // BCH
    private Long tongBCH;
    private Long bchHoatDong;

    // Chứng nhận
    private Long tongChungNhan;
    private Long chungNhanThangNay;

    // Hoạt động nổi bật
    private java.util.List<HoatDongDTO> hoatDongNoiBat;

    // Thống kê theo loại
    private java.util.Map<String, Long> thongKeoLoai;

    // Thống kê theo cấp độ
    private java.util.Map<String, Long> thongKeoCapDo;
}