package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO cho thống kê tham gia của sinh viên
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThongKeSinhVienDTO {
    private String maSv;
    private String hoTen;
    private String tenLop;
    private String tenKhoa;

    // Số liệu tham gia
    private Integer soHoatDongDangKy;
    private Integer soHoatDongDaThamGia;
    private Integer soHoatDongVangMat;

    // Điểm rèn luyện
    private Integer tongDiemRenLuyen;

    // Tỷ lệ
    private Double tyLeThamGia; // % tham gia / đăng ký

    // Hoạt động gần nhất
    private String hoatDongGanNhat;
    private LocalDate ngayThamGiaGanNhat;
}