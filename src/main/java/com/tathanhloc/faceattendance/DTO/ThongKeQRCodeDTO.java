package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho thống kê QR Code
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThongKeQRCodeDTO {
    // Tổng quan
    private Integer tongSoQRDaSinh;
    private Integer tongSoQRDaQuet;
    private Integer tongSoQRChuaQuet;
    private Double tyLeQuet;

    // Theo thời gian
    private LocalDateTime thoiGianQuetDauTien;
    private LocalDateTime thoiGianQuetCuoiCung;

    // Top người quét nhiều nhất
    private String bchQuetNhieuNhat;
    private Integer soLuotQuet;

    // Thời gian quét peak
    private String khungGioQuetNhieuNhat;
    private Integer soLuotQuetPeak;
}