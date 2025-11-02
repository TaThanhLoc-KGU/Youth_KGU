// AttendanceByActivityDTO.java
package com.tathanhloc.faceattendance.DTO;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceByActivityDTO {
    private String maHoatDong;
    private String tenHoatDong;
    private Long tongDangKy;
    private Long soLuongCoMat;
    private Long soLuongVang;
    private Double tiLeCoMat;
}