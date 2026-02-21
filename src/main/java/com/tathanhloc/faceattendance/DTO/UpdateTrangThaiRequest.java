package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO cho cập nhật trạng thái hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTrangThaiRequest {
    private String maHoatDong;
    private String trangThaiMoi; // Enum string
    private String ghiChu;
}