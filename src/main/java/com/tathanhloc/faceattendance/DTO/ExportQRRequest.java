package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO để export QR codes hàng loạt
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportQRRequest {
    private String maHoatDong;
    private List<String> danhSachMaSv;

    /**
     * Format: PDF, ZIP_PNG, ZIP_SVG, EXCEL
     */
    private String exportFormat;

    /**
     * Kích thước QR (pixels)
     */
    private Integer qrSize;

    /**
     * Có in thông tin sinh viên không
     */
    private Boolean includeStudentInfo;
}