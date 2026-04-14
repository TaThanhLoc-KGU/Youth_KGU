package com.tathanhloc.youthkgu.DTO;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ThiSinhDTO {
    private Long id;
    private Long cuocThiId;
    private String ten;
    private String moTa;
    private String anhDaiDien;
    private String urlMedia;
    private Integer soThuTu;
    private String thongTinThem;
    private Integer soVote;   // null nếu AN_DEN_CUOI và không phải admin
    private Boolean isActive;
    private String maSv;
}
