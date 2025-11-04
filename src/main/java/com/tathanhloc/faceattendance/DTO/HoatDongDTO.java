package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Enum.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoatDongDTO {
    private String maHoatDong;
    private String tenHoatDong;
    private String moTa;
    private LoaiHoatDongEnum loaiHoatDong;
    private CapDoEnum capDo;
    private LocalDate ngayToChuc;
    private LocalTime gioToChuc;

    // Time tracking
    private LocalTime thoiGianBatDau;
    private LocalTime thoiGianKetThuc;
    private Integer thoiGianTreToiDa;
    private Integer thoiGianToiThieu;
    private Integer choPhepCheckInSom;
    private Boolean yeuCauCheckOut;

    private String diaDiem;
    private String maPhong;
    private String tenPhong;
    private Integer soLuongToiDa;
    private Integer diemRenLuyen;
    private String maBchPhuTrach;
    private String tenNguoiPhuTrach;
    private String maKhoa;
    private String tenKhoa;
    private String maNganh;
    private String tenNganh;
    private TrangThaiHoatDongEnum trangThai;
    private Boolean yeuCauDiemDanh;
    private Boolean choPhepDangKy;
    private LocalDateTime hanDangKy;
    private String hinhAnhPoster;
    private String ghiChu;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}