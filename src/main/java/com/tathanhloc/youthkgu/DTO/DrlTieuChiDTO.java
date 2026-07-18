package com.tathanhloc.youthkgu.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrlTieuChiDTO {
    private Long id;
    private Long danhMucId;
    private String maTieuChi;
    private String noiDung;
    private Integer diemToiDa;
    private String chiTiet;
    private Integer thuTu;
}
