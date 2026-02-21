package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO cho Đăng ký hoạt động
 * QUAN TRỌNG: Chứa mã QR
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DangKyHoatDongDTO {
    private String maSv;
    private String hoTenSinhVien; // Thêm để hiển thị
    private String emailSinhVien; // Thêm để hiển thị
    private String tenLop; // Thêm để hiển thị

    private String maHoatDong;
    private String tenHoatDong; // Thêm để hiển thị
    private LocalDate ngayToChuc; // Thêm để hiển thị

    /**
     * MÃ QR DUY NHẤT
     * Format: {maHoatDong}{maSinhVien}
     * VD: TN202500121072006095
     */
    private String maQR;

    /**
     * Đường dẫn đến file QR code image
     */
    private String qrCodeImagePath;

    /**
     * Base64 của QR code image (để hiển thị trực tiếp)
     */
    private String qrCodeBase64;

    private LocalDateTime ngayDangKy;
    private String ghiChu;
    private Boolean daXacNhan;
    private Boolean isActive;

    // Trạng thái điểm danh (để kiểm tra)
    private Boolean daDiemDanh;
    private LocalDateTime thoiGianDiemDanh;
}