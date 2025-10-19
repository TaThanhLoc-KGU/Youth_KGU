package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO để điểm danh bằng QR code
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemDanhQRRequest {
    /**
     * Mã QR được quét từ camera
     * VD: TN202500121072006095
     */
    private String maQR;

    /**
     * Mã hoạt động đang điểm danh
     */
    private String maHoatDong;

    /**
     * Mã BCH người quét QR
     */
    private String maBchXacNhan;

    /**
     * Ghi chú (optional)
     */
    private String ghiChu;

    /**
     * Tọa độ GPS (optional - để verify vị trí)
     */
    private Double latitude;
    private Double longitude;

    /**
     * Thông tin thiết bị (optional - để audit)
     */
    private String thietBiQuet;
}