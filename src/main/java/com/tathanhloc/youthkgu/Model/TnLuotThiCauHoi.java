package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.LoaiCauHoiEnum;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Attempt_Details — bộ đề ĐÃ KHOÁ CỨNG của một lượt thi.
 * Sinh ra ngay khi lượt thi được tạo → F5 / mất mạng vẫn load lại đúng bộ đề này.
 * Các cột *_snapshot giữ đề bất biến kể cả khi admin sửa/xoá câu hỏi gốc sau đó.
 */
@Entity
@Table(name = "tn_luot_thi_cau_hoi",
        uniqueConstraints = @UniqueConstraint(name = "uq_tn_ltch", columnNames = {"luot_thi_id", "cau_hoi_id"}),
        indexes = { @Index(name = "idx_tn_ltch_lt", columnList = "luot_thi_id,thu_tu") })
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TnLuotThiCauHoi {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "luot_thi_id", nullable = false)
    private Long luotThiId;

    @Column(name = "cau_hoi_id", nullable = false)
    private Long cauHoiId;

    @Column(name = "thu_tu", nullable = false)
    private Integer thuTu;

    @Column(name = "diem", nullable = false, precision = 4, scale = 2)
    private BigDecimal diem;

    // ----- SNAPSHOT (bất biến) -----
    @Enumerated(EnumType.STRING)
    @Column(name = "loai", nullable = false, length = 20)
    private LoaiCauHoiEnum loai;

    @Column(name = "noi_dung_snapshot", nullable = false, columnDefinition = "TEXT")
    private String noiDungSnapshot;

    @Column(name = "hinh_anh_snapshot", length = 500)
    private String hinhAnhSnapshot;

    /** JSON: [{"id":.., "noiDung":".."}] — ĐÃ trộn, KHÔNG kèm cờ đúng/sai. */
    @Column(name = "dap_an_snapshot", nullable = false, columnDefinition = "JSON")
    private String dapAnSnapshot;

    /** JSON: [id,...] — CHỈ server đọc để chấm; không bao giờ serialize ra client. */
    @Column(name = "dap_an_dung_ids", nullable = false, columnDefinition = "JSON")
    private String dapAnDungIds;

    @Column(name = "giai_thich_snapshot", columnDefinition = "TEXT")
    private String giaiThichSnapshot;

    // ----- CÂU TRẢ LỜI của thí sinh (auto-save) -----
    /** JSON: [answerId,...] (mảng để hỗ trợ NHIEU_DAP_AN). */
    @Column(name = "tra_loi", columnDefinition = "JSON")
    private String traLoi;

    @Builder.Default @Column(name = "da_tra_loi", nullable = false)
    private Boolean daTraLoi = false;

    @Builder.Default @Column(name = "danh_dau", nullable = false)
    private Boolean danhDau = false;

    @Column(name = "thoi_gian_tra_loi")
    private LocalDateTime thoiGianTraLoi;

    // ----- KẾT QUẢ CHẤM -----
    @Column(name = "dung")
    private Boolean dung;

    @Column(name = "diem_dat_duoc", precision = 4, scale = 2)
    private BigDecimal diemDatDuoc;
}
