package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BanDTO {
    private String maBan;
    private String tenBan;
    private String loaiBan; // DOAN, HOI, DOI_CLB_BAN
    private String moTa;
    private String maKhoa;
    private String tenKhoa; // For display
    private Boolean isActive;
}