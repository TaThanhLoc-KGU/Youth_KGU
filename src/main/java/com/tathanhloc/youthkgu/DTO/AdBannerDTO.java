package com.tathanhloc.youthkgu.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdBannerDTO {
    private Long id;
    private String tieuDe;
    private String hinhAnh;
    private String duongDan;
    private String loai;   // MAIN | SIDEBAR
    private int thuTu;
    // Dùng Boolean (wrapper) để Lombok sinh getIsActive() thay vì isActive(),
    // giúp Jackson map đúng JSON key "isActive" thay vì "active".
    private Boolean isActive;
}
