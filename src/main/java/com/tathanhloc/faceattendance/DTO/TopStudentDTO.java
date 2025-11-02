// TopStudentDTO.java
package com.tathanhloc.faceattendance.DTO;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopStudentDTO {
    private String maSv;
    private String hoTen;
    private String email;
    private String tenLop;
    private String tenKhoa;
    private Long soHoatDongDangKy;
    private Long soHoatDongThamGia;
    private Double tiLeHoanThanh;
    private Integer tongDiemRenLuyen;
    private Integer rank;
}