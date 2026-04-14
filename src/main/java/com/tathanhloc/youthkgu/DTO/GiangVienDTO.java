package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiangVienDTO {
    private String maGv;
    private String hoTen;
    private String email;
    private Boolean isActive;
    private String maKhoa;
    private String tenKhoa;
}
