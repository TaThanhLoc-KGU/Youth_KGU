package com.tathanhloc.youthkgu.DTO;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Kết quả sau khi nộp bài / xem lại. */
@Data @Builder
public class TnKetQuaResponse {
    private Long luotThiId;
    private String trangThai;
    private BigDecimal diem;             // theo thang điểm của đề
    private BigDecimal diemTho;
    private BigDecimal tongDiemToiDa;
    private Integer soCauDung;
    private Integer tongSoCau;
    private Boolean dat;
    private LocalDateTime thoiGianNop;

    private Boolean hienChiTiet;         // theo cheDoHienKetQua + choXemLaiBai
    private List<CauHoi> chiTiet;

    @Data @Builder
    public static class CauHoi {
        private Integer thuTu;
        private String noiDung;
        private String loai;
        private List<Long> traLoi;
        private List<Long> dapAnDung;    // chỉ set khi hienDapAnDung = true
        private Boolean dung;
        private BigDecimal diemDatDuoc;
        private BigDecimal diem;
        private String giaiThich;
        private List<DapAn> dapAns;
    }

    @Data @Builder
    public static class DapAn {
        private Long id;
        private String noiDung;
    }
}
