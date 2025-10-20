package com.tathanhloc.faceattendance.DTO;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BCHDoanHoiDTO {
    private String maBch;
    private String hoTen;
    private String email;
    private String soDienThoai;
    private String chucVu;
    private String maKhoa;
    private String tenKhoa;
    private String nhiemKy;
    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}