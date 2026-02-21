package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho thống kê sinh viên
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThongKeSinhVienResponse {
    private String maSv;
    private String hoTen;
    private String email;
    private String tenLop;

    // Số liệu tham gia
    private Long tongDangKy;
    private Long daThamGia;
    private Long vangMat;
    private Long chuaDienRa;

    // Điểm rèn luyện
    private Integer tongDiemRenLuyen;
    private Integer diemTichLuy;

    // Tỷ lệ
    private Double tyLeThamGia;

    // Top hoạt động gần đây
    private java.util.List<HoatDongDTO> hoatDongGanDay;
}