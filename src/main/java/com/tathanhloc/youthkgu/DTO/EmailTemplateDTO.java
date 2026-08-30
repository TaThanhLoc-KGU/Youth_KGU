package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateDTO {
    private Long id;
    private String tenMau;
    private String tieuDe;
    private String noiDung;
    private String nguoiTao;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
