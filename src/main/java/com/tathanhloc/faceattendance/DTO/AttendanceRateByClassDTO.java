package com.tathanhloc.faceattendance.DTO;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRateByClassDTO {
    private String maLop;
    private String tenLop;
    private String maKhoa;
    private String tenKhoa;
    private String maNganh;
    private String tenNganh;

    private Long tongSinhVien;
    private Long tongLuotDangKy;
    private Long tongLuotThamGia;
    private Long tongLuotVang;

    private Double tiLeThamGia;
    private Double tiLeVang;

    private Long soHoatDong;
}