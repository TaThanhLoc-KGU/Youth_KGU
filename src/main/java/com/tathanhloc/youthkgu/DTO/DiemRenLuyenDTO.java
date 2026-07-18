package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemRenLuyenDTO {

    private Long id;
    private String maSv;
    private String tenSv;       // join từ sinh_vien
    private String maHocKy;
    private String tenHocKy;    // join từ hoc_ky

    private Long mauId;
    private String tenMau;

    /** Điểm từng tiêu chí: {"1.1":15,"2.1":10,...} */
    private Map<String, Integer> scores;

    private Integer tongDiem;
    private String xepLoai;
    private String trangThai;
    private Integer version;
    private String ghiChu;

    private String nguoiTao;
    private String nguoiCapNhat;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
