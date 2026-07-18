package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemRenLuyenLichSuDTO {

    private Long id;
    private Long drlId;
    private String maSv;
    private String maHocKy;
    private Long mauId;
    private Integer version;
    private Map<String, Integer> scores;
    private Integer tongDiem;
    private String xepLoai;
    private String ghiChu;
    private String lyDoThayDoi;
    private String nguoiThucHien;
    private LocalDateTime thoiGian;
}
