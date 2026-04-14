package com.tathanhloc.youthkgu.DTO;

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
     * Mã hoạt động — BCH đang quét cho hoạt động nào.
     * Dùng làm fallback khi maQR bị lỗi encoding (jsQR decode Latin-1 thay vì UTF-8).
     */
    private String maHoatDong;

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

    /**
     * Override chế độ quét: "CHECKIN" hoặc "CHECKOUT".
     * Khi BCH chọn rõ ràng trên giao diện, bỏ qua kiểm tra cửa sổ thời gian.
     * null = tự động theo logic cũ.
     */
    private String attendanceMode;
}