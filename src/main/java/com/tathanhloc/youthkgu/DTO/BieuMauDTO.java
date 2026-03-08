package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BieuMauDTO {
    private Long id;
    private String ten;
    private String duongDan;
    private String loaiFile;
    private Long kichThuoc;
    private int thuTu;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
