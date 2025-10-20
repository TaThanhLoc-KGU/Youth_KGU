package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho validation QR Code
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QRValidationResult {
    private boolean valid;
    private String message;
    private String hoTenSinhVien;
    private String maSinhVien;
    private String maHoatDong;
    private String tenHoatDong;

    @Builder.Default
    private java.time.LocalDateTime timestamp = java.time.LocalDateTime.now();

    public static QRValidationResult valid(String message, String hoTen, String maSv) {
        return QRValidationResult.builder()
                .valid(true)
                .message(message)
                .hoTenSinhVien(hoTen)
                .maSinhVien(maSv)
                .build();
    }

    public static QRValidationResult invalid(String message) {
        return QRValidationResult.builder()
                .valid(false)
                .message(message)
                .build();
    }
}
