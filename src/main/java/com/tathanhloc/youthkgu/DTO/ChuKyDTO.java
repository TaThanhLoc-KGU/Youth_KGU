package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChuKyDTO {
    private Long id;
    private String tenNguoiKy;
    private String chucVu;
    private String duongDan;
    private Boolean laMacDinh;
    private String ownerUsername;
    private String loaiChuKy;
    private LocalDateTime createdAt;
}
