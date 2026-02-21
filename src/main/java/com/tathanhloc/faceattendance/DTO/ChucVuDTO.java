package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChucVuDTO {
    private String maChucVu;
    private String tenChucVu;
    private String thuocBan; // DOAN, HOI, BAN_PHUC_VU
    private String moTa;
    private Integer thuTu;
    private Boolean isActive;
}