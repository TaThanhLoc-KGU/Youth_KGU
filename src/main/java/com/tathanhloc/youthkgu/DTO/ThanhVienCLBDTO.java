package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThanhVienCLBDTO {

    private Long id;
    private String maClb;
    private String tenClb;

    // Sinh viên
    private String maSv;
    private String hoTen;
    private String maLop;
    private String tenLop;
    private String tenKhoa;
    private String avatar;

    // Học kỳ
    private String maHocKy;
    private String tenHocKy;

    private String chucVu;
    private String chucVuLabel; // hiển thị tiếng Việt
    private LocalDate ngayThamGia;
    private LocalDate ngayRoiClb;
    private String ghiChu;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
