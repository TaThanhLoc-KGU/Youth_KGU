package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho kết quả validate QR code
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QRValidationResult {
    private Boolean isValid;
    private String message;

    // Thông tin từ QR nếu valid
    private String maSv;
    private String hoTen;
    private String maHoatDong;
    private String tenHoatDong;

    // Error details nếu invalid
    private String errorCode;
    private String errorDetail;

    // Validation flags
    private Boolean qrExists;
    private Boolean belongsToActivity;
    private Boolean alreadyUsed;
    private Boolean studentRegistered;

    public static QRValidationResult valid(String maSv, String hoTen, String maHoatDong, String tenHoatDong) {
        return QRValidationResult.builder()
                .isValid(true)
                .message("Mã QR hợp lệ")
                .maSv(maSv)
                .hoTen(hoTen)
                .maHoatDong(maHoatDong)
                .tenHoatDong(tenHoatDong)
                .qrExists(true)
                .belongsToActivity(true)
                .alreadyUsed(false)
                .studentRegistered(true)
                .build();
    }

    public static QRValidationResult invalid(String errorCode, String errorDetail) {
        return QRValidationResult.builder()
                .isValid(false)
                .message("Mã QR không hợp lệ")
                .errorCode(errorCode)
                .errorDetail(errorDetail)
                .build();
    }
}