package com.tathanhloc.youthkgu.DTO;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class TnDeThiDTO {
    private Long id;
    private String tieuDe;
    private String moTa;
    private String cheDo;
    private String maHoatDong;
    private String maKhoa;
    private Integer thoiLuongPhut;
    private LocalDateTime moLuc;
    private LocalDateTime dongLuc;
    private Integer soLanLamToiDa;
    private Boolean tronCauHoi;
    private Boolean tronDapAn;
    private Boolean chamDiemTungPhan;
    private BigDecimal thangDiem;
    private BigDecimal diemDat;
    private String cheDoHienKetQua;
    private Boolean choXemLaiBai;
    private Boolean hienDapAnDung;
    private Integer tongSoCau;
    private String trangThai;
    private LocalDateTime createdAt;

    /** Chỉ trả khi xem chi tiết. */
    private List<TnDeThiCauHoiDTO> cauHoiCoDinh;
    private List<TnMaTranDTO> maTran;

    @Data @Builder
    public static class TnDeThiCauHoiDTO {
        private Long cauHoiId;
        private Integer thuTu;
        private BigDecimal diemGhiDe;
        private String noiDung;   // preview
    }

    @Data @Builder
    public static class TnMaTranDTO {
        private Long danhMucId;
        private String danhMucTen;
        private String doKho;
        private Integer soLuong;
        private BigDecimal diemMoiCau;
        private Long soCauKhaDung;   // để admin biết ngân hàng có đủ câu không
    }
}
