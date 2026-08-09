package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChungNhanTemplateImageResult {
    private String duongDan;
    private Integer chieuRongPx;
    private Integer chieuCaoPx;
}
