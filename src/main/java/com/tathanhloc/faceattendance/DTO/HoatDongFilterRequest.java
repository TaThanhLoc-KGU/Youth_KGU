package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho filter/search hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoatDongFilterRequest {
    private String keyword; // Tìm theo tên
    private String loaiHoatDong; // ENUM
    private String capDo; // ENUM
    private String trangThai; // ENUM
    private java.time.LocalDate tuNgay;
    private java.time.LocalDate denNgay;
    private String maKhoa;
    private String maNganh;
    private Boolean choPhepDangKy;

    // Pagination
    private Integer page;
    private Integer size;
    private String sortBy;
    private String sortDir;
}