package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TinTucDTO {
    // Request fields
    private String tieuDe;
    private String tomTat;
    private String noiDung;
    private String anhDaiDien;
    private Long chuyenMucId;
    private Long vanBanId;
    private String hoatDongId;
    private String donViDang;
    private Boolean isGhim;

    // Response fields
    private Long id;
    private String slug;
    private String fullUrlPath;
    private String tenChuyenMuc;
    private String trangThai;
    private String nguoiTao;
    private Integer luotXem;
    private LocalDateTime ngayXuatBan;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
