package com.tathanhloc.faceattendance.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotNull(message = "ID điểm danh không được trống")
    private Long diemDanhId;

    @NotBlank(message = "Mã BCH xác nhận không được trống")
    private String maBchXacNhan;

    private String ghiChu;
}