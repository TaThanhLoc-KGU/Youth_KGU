package com.tathanhloc.youthkgu.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TickerItemDTO {
    private Long id;
    private String noiDung;
    private String duongDan;
    private int thuTu;
    // Dùng Boolean (wrapper) để Lombok sinh getIsActive() thay vì isActive(),
    // giúp Jackson map đúng JSON key "isActive" thay vì "active".
    private Boolean isActive;
}
