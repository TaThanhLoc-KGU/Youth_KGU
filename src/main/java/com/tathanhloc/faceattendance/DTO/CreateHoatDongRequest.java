package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO cho tạo hoạt động mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateHoatDongRequest {
    private String maHoatDong;
    private String tenHoatDong;
    private String moTa;
    private String loaiHoatDong; // Enum string
    private String capDo; // Enum string
    private java.time.LocalDate ngayToChuc;
    private java.time.LocalTime gioToChuc;
    private String diaDiem;
    private String maPhong;
    private Integer soLuongToiDa;
    private Integer diemRenLuyen;
    private String maBchPhuTrach;
    private String maKhoa;
    private String maNganh;
    private java.time.LocalDateTime hanDangKy;
    private String hinhAnhPoster;
    private String ghiChu;
}