package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.CheDoDiemDanhEnum;
import com.tathanhloc.youthkgu.Enum.LoaiHoatDongEnum;
import com.tathanhloc.youthkgu.Enum.TrangThaiHoatDongEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityAttendanceOverviewDTO {

    private String maHoatDong;
    private String tenHoatDong;
    private LocalDate ngayToChuc;
    private LocalTime gioToChuc;
    private LocalTime thoiGianBatDau;
    private LocalTime thoiGianKetThuc;
    private String diaDiem;
    private TrangThaiHoatDongEnum trangThai;
    private LoaiHoatDongEnum loaiHoatDong;
    private CheDoDiemDanhEnum cheDoDiemDanh;
    private long soLuongDangKy;
    private long soLuongDaDiemDanh;
    private Integer diemRenLuyen;
    private String maDanhMucRenLuyen;
}
