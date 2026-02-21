package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho danh sách sinh viên tích cực nhất
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopStudentDTO {
    private String maSv;                    // Mã sinh viên
    private String hoTen;                   // Họ tên
    private String email;                   // Email
    private String tenLop;                  // Tên lớp
    private String tenKhoa;                 // Tên khoa
    private Long soHoatDongDangKy;          // Số hoạt động đăng ký
    private Long soHoatDongThamGia;         // Số hoạt động tham gia
    private Double tiLeHoanThanh;           // Tỷ lệ hoàn thành (%)
    private Integer tongDiemRenLuyen;       // Tổng điểm rèn luyện
    private Integer rank;                   // Thứ hạng
}
