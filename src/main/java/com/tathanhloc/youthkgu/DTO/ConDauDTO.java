package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConDauDTO {
    private Long id;
    private String ten;
    private String duongDan;
    private Boolean laMacDinh;
    private String ownerUsername;
    private LocalDateTime createdAt;
}
