package com.tathanhloc.faceattendance.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO cho điểm danh bằng QR Code
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemDanhQRRequest {
    /**
     * Mã QR đã quét (format: maHoatDong + maSinhVien)
     */
    private String maQR;

    /**
     * Mã BCH người xác nhận (người quét QR)
     */
    private String maBchXacNhan;

    /**
     * Thông tin GPS
     */
    private Double latitude;
    private Double longitude;

    /**
     * Thông tin thiết bị
     */
    private String thietBi; // VD: "iPhone 13", "Samsung Galaxy S21"

    /**
     * Ghi chú thêm (nếu có)
     */
    private String ghiChu;
}