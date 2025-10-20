package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO cho dashboard BCH
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BCHDashboardResponse {
    // Thông tin BCH
    private BCHDoanHoiDTO bchInfo;

    // Hoạt động đang quản lý
    private Long soHoatDongDangPhuTrach;
    private List<HoatDongDTO> hoatDongSapToi;

    // Thống kê điểm danh
    private Long soLuotXacNhan;
    private Long soSinhVienDaXacNhan;

    // Hoạt động hôm nay
    private List<HoatDongDTO> hoatDongHomNay;
}
