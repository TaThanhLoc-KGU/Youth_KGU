package com.tathanhloc.faceattendance.DTO;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChungNhanHoatDongDTO {
    private Long id;
    private String maChungNhan;
    private String maSv;
    private String hoTenSinhVien;
    private String emailSinhVien;
    private String maHoatDong;
    private String tenHoatDong;
    private LocalDate ngayCap;
    private String noiDung;
    private String filePath;
    private Boolean isActive;
    private LocalDateTime createdAt;
}