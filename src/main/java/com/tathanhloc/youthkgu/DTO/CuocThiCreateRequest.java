package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.*;
import lombok.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CuocThiCreateRequest {
    @NotBlank
    private String tieuDe;
    private String moTa;
    private String anhBia;
    private String slug; // nếu null, tự generate từ tieuDe
    @NotNull
    private LoaiCuocThiEnum loaiCuocThi;
    private String maHoatDong; // nullable
    @NotNull
    private HienThiKetQuaEnum hienThiKetQua;
    @NotNull
    private DieuKienVoteEnum dieuKienVote;
    @NotNull
    private QuyTacVoteEnum quyTacVote;
    private Integer soLuotToiDa;
    private LocalDateTime thoiGianMoVote;
    private LocalDateTime thoiGianDongVote;
    private Boolean choPhepNopBai;
    private LocalDateTime hanNop;
}
