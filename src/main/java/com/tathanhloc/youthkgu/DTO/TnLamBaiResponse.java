package com.tathanhloc.youthkgu.DTO;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/** Payload màn hình làm bài — KHÔNG chứa đáp án đúng. */
@Data @Builder
public class TnLamBaiResponse {
    private Long luotThiId;
    private Long deThiId;
    private String tieuDe;
    private Integer lanThu;
    private Integer thoiLuongPhut;
    private LocalDateTime thoiGianBatDau;
    private LocalDateTime thoiGianHanNop;   // client dựng đồng hồ đếm ngược từ đây
    private LocalDateTime serverTime;        // để client bù lệch giờ
    private String trangThai;
    private Integer tongSoCau;
    private Boolean tiepTuc;                 // true = F5/khôi phục lượt đang dở
    private List<CauHoi> cauHois;

    @Data @Builder
    public static class CauHoi {
        private Long id;             // = tn_luot_thi_cau_hoi.id
        private Long cauHoiId;
        private Integer thuTu;
        private String loai;
        private String noiDung;
        private String hinhAnh;
        private List<DapAn> dapAns;   // đã trộn sẵn, không có cờ đúng/sai
        private List<Long> traLoi;    // đáp án đã lưu (nếu có)
        private Boolean danhDau;
    }

    @Data @Builder
    public static class DapAn {
        private Long id;
        private String noiDung;
        private String hinhAnh;
    }
}
