package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BCHChucVuDTO {
    private Long id;
    private String maBch;
    private String hoTenBch; // For display
    private String maChucVu;
    private String tenChucVu; // For display
    private String maBan;
    private String tenBan; // For display
    private LocalDate ngayNhanChuc;
    private LocalDate ngayKetThuc;
    private Boolean isActive;
}