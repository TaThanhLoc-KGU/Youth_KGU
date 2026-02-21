package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChuyenVienDTO {
    private String maChuyenVien;
    private String hoTen;
    private String email;
    private String sdt;
    private String chucDanh;
    private String maKhoa;
    private String tenKhoa; // For display
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}