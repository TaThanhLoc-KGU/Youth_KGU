package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho thống kê tỷ lệ tham gia theo khoa
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipationByFacultyDTO {
    private String maKhoa;              // Mã khoa
    private String tenKhoa;             // Tên khoa
    private Long tongSinhVien;          // Tổng sinh viên
    private Long soLuongDangKy;         // Số lượng đăng ký
    private Long soLuongThamGia;        // Số lượng tham gia
    private Double tiLeThamGia;         // Tỷ lệ tham gia (%)
    private Long tongHoatDong;          // Tổng hoạt động
}
