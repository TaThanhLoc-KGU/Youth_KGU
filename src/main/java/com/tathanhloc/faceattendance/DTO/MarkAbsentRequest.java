package com.tathanhloc.faceattendance.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
/**
 * Request DTO cho đánh dấu vắng mặt
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkAbsentRequest {

    @NotBlank(message = "Mã sinh viên không được trống")
    private String maSv;

    @NotBlank(message = "Mã hoạt động không được trống")
    private String maHoatDong;

    @NotBlank(message = "Ghi chú không được trống")
    private String ghiChu;
}