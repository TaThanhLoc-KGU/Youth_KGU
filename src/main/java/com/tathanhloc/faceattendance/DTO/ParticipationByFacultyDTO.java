package com.tathanhloc.faceattendance.DTO;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationByFacultyDTO {
    private String maKhoa;
    private String tenKhoa;
    private Long tongSinhVien;
    private Long soLuongDangKy;
    private Long soLuongThamGia;
    private Double tiLeThamGia;
    private Long tongHoatDong;
}