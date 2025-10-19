package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO cho Ban Chấp Hành Đoàn - Hội
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BCHDoanHoiDTO {
    private String maBch;
    private String hoTen;
    private String gioiTinh;
    private LocalDate ngaySinh;
    private String email;
    private String sdt;
    private String chucVu;
    private String nhiemVu;
    private String maKhoa;
    private String tenKhoa; // Thêm để hiển thị
    private String hinhAnh;
    private Boolean isActive;
}