package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.DoKhoCauHoiEnum;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/** Mode NGẪU NHIÊN: mỗi dòng là 1 "rổ" bốc câu hỏi. */
@Entity
@Table(name = "tn_ma_tran", indexes = { @Index(name = "idx_tn_mt_dt", columnList = "de_thi_id") })
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TnMaTran {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "de_thi_id", nullable = false)
    private Long deThiId;

    /** NULL = mọi danh mục. */
    @Column(name = "danh_muc_id")
    private Long danhMucId;

    /** NULL = mọi mức độ. */
    @Enumerated(EnumType.STRING)
    @Column(name = "do_kho", length = 15)
    private DoKhoCauHoiEnum doKho;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    /** NULL = dùng tn_cau_hoi.diem. */
    @Column(name = "diem_moi_cau", precision = 4, scale = 2)
    private BigDecimal diemMoiCau;

    @Builder.Default
    @Column(name = "thu_tu", nullable = false)
    private Integer thuTu = 0;
}
