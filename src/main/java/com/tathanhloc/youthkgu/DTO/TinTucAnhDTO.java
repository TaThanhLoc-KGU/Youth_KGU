package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TinTucAnhDTO {
    private Long id;
    private String duongDan;
    private String tenFileGoc;
    private String moTa;
    private Integer thuTu;
    private LocalDateTime ngayUpload;
}
