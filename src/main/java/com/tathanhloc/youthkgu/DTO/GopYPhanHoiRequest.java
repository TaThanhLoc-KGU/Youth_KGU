package com.tathanhloc.youthkgu.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GopYPhanHoiRequest {
    private String phanHoi;
    private String trangThai; // MOI | DANG_XU_LY | DA_XU_LY | TU_CHOI
}
