package com.tathanhloc.youthkgu.DTO;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Request tạo/sửa đề thi — rẽ nhánh theo cheDo. */
@Data
public class TnDeThiCreateRequest {

    private String tieuDe;
    private String moTa;
    private String cheDo;              // CO_DINH | NGAU_NHIEN
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
    private String cheDoHienKetQua;    // NGAY | SAU_KHI_DONG | KHONG
    private Boolean choXemLaiBai;
    private Boolean hienDapAnDung;

    /** Chỉ dùng khi cheDo = CO_DINH. */
    private List<CauHoiCoDinhItem> cauHoiCoDinh;

    /** Chỉ dùng khi cheDo = NGAU_NHIEN. */
    private List<MaTranItem> maTran;

    @Data
    public static class CauHoiCoDinhItem {
        private Long cauHoiId;
        private Integer thuTu;
        private BigDecimal diemGhiDe;   // nullable
    }

    @Data
    public static class MaTranItem {
        private Long danhMucId;         // nullable = mọi danh mục
        private String doKho;           // nullable = mọi mức độ
        private Integer soLuong;
        private BigDecimal diemMoiCau;  // nullable
    }
}
