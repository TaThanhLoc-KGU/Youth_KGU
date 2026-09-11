package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/** Mode CỐ ĐỊNH: map cứng câu hỏi vào đề + thứ tự cố định. */
@Entity
@Table(name = "tn_de_thi_cau_hoi",
        uniqueConstraints = @UniqueConstraint(name = "uq_tn_dtch", columnNames = {"de_thi_id", "cau_hoi_id"}),
        indexes = { @Index(name = "idx_tn_dtch_dt", columnList = "de_thi_id,thu_tu") })
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TnDeThiCauHoi {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "de_thi_id", nullable = false)
    private Long deThiId;

    @Column(name = "cau_hoi_id", nullable = false)
    private Long cauHoiId;

    @Builder.Default
    @Column(name = "thu_tu", nullable = false)
    private Integer thuTu = 0;

    /** Ghi đè điểm câu hỏi cho riêng đề này (null = dùng tn_cau_hoi.diem). */
    @Column(name = "diem_ghi_de", precision = 4, scale = 2)
    private BigDecimal diemGhiDe;
}
