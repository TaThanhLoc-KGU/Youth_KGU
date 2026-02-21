package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;

/**
 * Request DTO cho đăng ký hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DangKyHoatDongRequest {

    @NotBlank(message = "Mã sinh viên không được trống")
    private String maSv;

    @NotBlank(message = "Mã hoạt động không được trống")
    private String maHoatDong;

    private String ghiChu;
}
