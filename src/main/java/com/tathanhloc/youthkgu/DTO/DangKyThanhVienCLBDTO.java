package com.tathanhloc.youthkgu.DTO;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DangKyThanhVienCLBDTO {
    private Long id;
    private String maClb;
    private String tenClb;
    private String loaiClb;

    // Sinh viên
    private String maSv;
    private String hoTen;
    private String tenLop;
    private String tenKhoa;
    private String avatar;

    // Đơn
    private String trangThai;       // CHO_DUYET | DA_DUYET | TU_CHOI | HUY
    private String trangThaiLabel;
    private String lyDoDangKy;
    private String lyDoXuLy;
    private String nguoiXuLy;
    private LocalDateTime ngayXuLy;
    private LocalDateTime createdAt;
}
