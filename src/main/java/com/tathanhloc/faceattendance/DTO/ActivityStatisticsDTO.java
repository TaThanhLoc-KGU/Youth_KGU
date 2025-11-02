// ActivityStatisticsDTO.java
package com.tathanhloc.faceattendance.DTO;

import lombok.*;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityStatisticsDTO {
    private Long tongHoatDong;
    private Long hoatDongSapDienRa;
    private Long hoatDongDangDienRa;
    private Long hoatDongDaHoanThanh;
    private Long hoatDongDaHuy;

    // Theo loại hoạt động
    private Map<String, Long> thongKeTheoLoai;

    // Theo cấp độ
    private Map<String, Long> thongKeTheoCapDo;

    // Thống kê đăng ký
    private Long tongLuotDangKy;
    private Long tongLuotThamGia;
    private Double tiLeThamGiaTrungBinh;

    // Điểm rèn luyện
    private Integer tongDiemRenLuyen;
    private Double diemRenLuyenTrungBinh;
}