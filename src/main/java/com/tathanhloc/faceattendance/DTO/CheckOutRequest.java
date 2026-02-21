package com.tathanhloc.faceattendance.DTO;

import jakarta.validation.constraints.NotBlank;
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

    @NotBlank(message = "Mã BCH xác nhận không được trống")
    private String maBchXacNhan;

    private String ghiChu;
}