package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrlMauDanhGiaDTO {
    private Long id;
    private String tenMau;
    private String moTa;
    private String namHoc;
    private Integer phienBan;
    private Long mauChaId;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<DrlDanhMucDTO> danhMucList;
}
