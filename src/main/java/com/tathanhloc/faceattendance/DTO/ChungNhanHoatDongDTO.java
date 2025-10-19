package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO cho Chứng nhận hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChungNhanHoatDongDTO {
    private Long id;
    private String maChungNhan;

    private String maSv;
    private String hoTenSinhVien; // Thêm để hiển thị

    private String maHoatDong;
    private String tenHoatDong; // Thêm để hiển thị

    private LocalDate ngayCap;
    private String noiDungChungNhan;

    private String maBchKy;
    private String tenNguoiKy; // Thêm để hiển thị

    private String filePdf;
    private Boolean isActive;
    private LocalDateTime createdAt;
}