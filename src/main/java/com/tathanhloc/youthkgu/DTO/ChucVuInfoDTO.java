package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChucVuInfoDTO {
    private String maChucVu;
    private String tenChucVu;
    private String thuocBan;
    private String maBan;
    private String tenBan;
}
