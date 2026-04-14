package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VanBanDTO {
    // Request fields
    private String soHieu;
    private String trichYeu;
    private String loaiVanBan;
    private Long chuyenMucId;
    private String coQuanBanHanh;
    private String nguoiKy;
    private LocalDate ngayBanHanh;
    private LocalDate ngayHieuLuc;
    private LocalDate ngayHetHan;
    private String hoatDongId;
    private String donViDang;

    // Response fields
    private Long id;
    private String slug;
    private String fullUrlPath;
    private String tenChuyenMuc;
    private String trangThai;
    private String hieuLuc;
    private String nguoiDang;
    private Integer luotXem;
    private Integer luotTai;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // File đính kèm (response)
    private String tenFile;
    private String duongDanFile;
    private String loaiFile;
    private Long kichThuocFile;
}
