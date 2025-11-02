package com.tathanhloc.faceattendance.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KhoaHocDTO {
    private String maKhoaHoc;
    private String tenKhoaHoc;
    private Integer namBatDau;
    private Integer namKetThuc;
    private Boolean isCurrent;
    private Boolean isActive;
}
