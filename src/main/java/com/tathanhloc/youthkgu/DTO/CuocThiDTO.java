package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CuocThiDTO {
    private Long id;
    private String tieuDe;
    private String moTa;
    private String anhBia;
    private String slug;
    private LoaiCuocThiEnum loaiCuocThi;
    private String maHoatDong;
    private String tenHoatDong;
    private TrangThaiCuocThiEnum trangThai;
    private HienThiKetQuaEnum hienThiKetQua;
    private DieuKienVoteEnum dieuKienVote;
    private QuyTacVoteEnum quyTacVote;
    private Integer soLuotToiDa;
    private LocalDateTime thoiGianMoVote;
    private LocalDateTime thoiGianDongVote;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<ThiSinhDTO> danhSachThiSinh;
    private Long tongSoVote;
    private boolean dangMoVote; // computed: trangThai == DANG_MO và trong thời gian vote
}
