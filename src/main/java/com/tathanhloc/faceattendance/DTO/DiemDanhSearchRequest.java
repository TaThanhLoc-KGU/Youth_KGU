package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Enum.TrangThaiThamGiaEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho tìm kiếm và lọc điểm danh
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemDanhSearchRequest {
    private String maHoatDong;
    private String maSv;
    private String maLop;
    private String maKhoa;

    private TrangThaiThamGiaEnum trangThai;

    private LocalDateTime tuNgay;
    private LocalDateTime denNgay;

    private String maBchXacNhan;

    // Pagination
    private Integer page;
    private Integer size;
}
