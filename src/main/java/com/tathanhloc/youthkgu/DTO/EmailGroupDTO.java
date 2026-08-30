package com.tathanhloc.youthkgu.DTO;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailGroupDTO {
    private Long id;
    private String tenNhom;
    private String diaChiEmail;
    private String maKhoa;
    private String tenKhoa;
    private Boolean isActive;
}
