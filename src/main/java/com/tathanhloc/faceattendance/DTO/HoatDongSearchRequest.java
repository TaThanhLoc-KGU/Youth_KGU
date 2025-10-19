package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Enum.CapDoEnum;
import com.tathanhloc.faceattendance.Enum.LoaiHoatDongEnum;
import com.tathanhloc.faceattendance.Enum.TrangThaiHoatDongEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO cho tìm kiếm và lọc hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoatDongSearchRequest {
    private String keyword;
    private LoaiHoatDongEnum loaiHoatDong;
    private TrangThaiHoatDongEnum trangThai;
    private CapDoEnum capDo;

    private String maKhoa;
    private String maNganh;
    private String maBchPhuTrach;

    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;

    private Boolean choPhepDangKy;

    // Pagination
    private Integer page;
    private Integer size;
    private String sortBy;
    private String sortDirection;
}