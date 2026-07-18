package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrlDanhMucDTO {
    private Long id;
    private Long mauId;
    private String maDanhMuc;
    private String tenDanhMuc;
    private Integer diemToiDa;
    private Integer thuTu;
    private List<DrlTieuChiDTO> tieuChiList;
}
