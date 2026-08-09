package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChungNhanTemplateDTO {
    private Long id;
    private String ten;
    private String hinhNen;
    private Integer chieuRongPx;
    private Integer chieuCaoPx;
    private List<ChungNhanTemplateFieldDTO> fields;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
