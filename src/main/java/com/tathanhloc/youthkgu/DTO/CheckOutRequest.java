package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO cho check-out
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckOutRequest {

    // Có thể dùng ID hoặc QR Code
    private Long diemDanhId;

    private String maQR;

    // ✅ FIX: Không @NotBlank — admin checkout thủ công có thể không có BCH xác nhận
    private String maBchXacNhan;

    private String ghiChu;

    private Double latitude;
    private Double longitude;
    private String thietBi;
}