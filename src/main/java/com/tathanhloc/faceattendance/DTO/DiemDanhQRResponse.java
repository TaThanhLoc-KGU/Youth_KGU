package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO sau khi điểm danh QR
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemDanhQRResponse {
    private Boolean success;
    private String message;

    // Thông tin sinh viên đã điểm danh
    private String maSv;
    private String hoTen;
    private String tenLop;

    // Thông tin hoạt động
    private String maHoatDong;
    private String tenHoatDong;

    // Thông tin điểm danh
    private LocalDateTime thoiGianCheckIn;
    private String trangThai;

    // Error details (nếu có)
    private String errorCode;
    private String errorDetail;
}