package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO để đăng ký hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DangKyHoatDongRequest {
    private String maSv;
    private String maHoatDong;
    private String ghiChu;
}