package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho lịch sử tham gia của sinh viên
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentHistoryDTO {
    private String maSv;
    private String hoTen;
    private String email;
    private String tenLop;

    // Danh sách hoạt động đã tham gia
    private java.util.List<DiemDanhHoatDongDTO> lichSuThamGia;

    // Danh sách đăng ký chưa diễn ra
    private java.util.List<DangKyHoatDongDTO> hoatDongSapToi;

    // Chứng nhận đã nhận
    private java.util.List<ChungNhanHoatDongDTO> chungNhan;

    // Thống kê tổng hợp
    private ThongKeSinhVienResponse thongKe;
}