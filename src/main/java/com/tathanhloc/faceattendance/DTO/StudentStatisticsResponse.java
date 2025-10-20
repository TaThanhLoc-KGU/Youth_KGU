package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO cho thống kê sinh viên
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentStatisticsResponse {
    private String maSv;
    private String hoTen;
    private String tenLop;

    private Long tongSoHoatDong;
    private Long daThamGia;
    private Long dangKy;
    private Long vangMat;

    private Integer tongDiemRenLuyen;
    private Integer soChungNhan;

    private List<DiemDanhHoatDongDTO> lichSuThamGia;
}