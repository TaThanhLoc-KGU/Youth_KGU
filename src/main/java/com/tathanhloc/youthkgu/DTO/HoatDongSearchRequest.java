package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.CapDoEnum;
import com.tathanhloc.youthkgu.Enum.LoaiHoatDongEnum;
import com.tathanhloc.youthkgu.Enum.TrangThaiHoatDongEnum;
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