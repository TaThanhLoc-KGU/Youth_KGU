package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.*;
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

    // Location
    private Double viDo;
    private Double kinhDo;
    private Integer khoangCachToiDa;

    // Early termination
    private Boolean ketThucSom;
    private LocalDateTime thoiGianKetThucThucTe;
    private Integer thoiGianChoPhepCheckOut;

    private String diaDiem;
    private String maPhong;
    private String tenPhong;
    private Integer soLuongToiDa;
    private Long soNguoiDangKy; // Số người đã đăng ký (tính từ bảng dang_ky_hoat_dong)

    // Điểm rèn luyện & tiêu chí
    private Integer diemRenLuyen;
    private String maDanhMucRenLuyen;
    private String maTieuChiRenLuyen;
    private Integer diemToiDaTieuChi;

    private String maBchPhuTrach;
    private String tenNguoiPhuTrach;
    private String maKhoa;
    private String tenKhoa;
    private String maNganh;
    private String tenNganh;

    // Học kỳ & Năm học
    private Integer soHocKy;
    private String maNamHoc;
    private String tenNamHoc;

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