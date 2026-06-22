package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanChuNhiemCLBDTO {
    private Long id;
    private String maClb;
    private String tenClb;
    /** SV | GV | CV */
    private String loaiNguoi;
    private String maSv;
    private String maGv;
    private String maCv;
    /** Tên hiển thị (sv.hoTen / gv.hoTen / cv.hoTen) */
    private String tenNguoi;
    /** Lớp (SV) hoặc Đơn vị (GV/CV) */
    private String donVi;
    // Giữ lại tenSv/lop để tương thích ngược
    private String tenSv;
    private String lop;
    private String chucVu;
    private String nhiemKy;
    private String trangThai;
    private String emailLienHe;
    private String sdt;
    private LocalDate ngayBoNhiem;
    private LocalDate ngayThoiChuc;
    private String ghiChu;
    private LocalDateTime createdAt;
}
