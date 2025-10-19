package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Enum.CapDoEnum;
import com.tathanhloc.faceattendance.Enum.LoaiHoatDongEnum;
import com.tathanhloc.faceattendance.Enum.TrangThaiHoatDongEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO cho Hoạt động
 */
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
    private LocalDateTime thoiGianBatDau;
    private LocalDateTime thoiGianKetThuc;
    private String diaDiem;
    private String maPhong;
    private String tenPhong; // Thêm để hiển thị
    private Integer soLuongToiDa;
    private Integer diemRenLuyen;
    private String maBchPhuTrach;
    private String tenNguoiPhuTrach; // Thêm để hiển thị
    private String maKhoa;
    private String tenKhoa; // Thêm để hiển thị
    private String maNganh;
    private String tenNganh; // Thêm để hiển thị
    private TrangThaiHoatDongEnum trangThai;
    private Boolean yeuCauDiemDanh;
    private Boolean choPhepDangKy;
    private LocalDateTime hanDangKy;
    private String hinhAnhPoster;
    private Boolean isActive;

    // Thống kê
    private Integer soNguoiDaDangKy;
    private Integer soNguoiDaThamGia;
    private Double tyLeThamGia;
    private Integer soChoConLai;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}