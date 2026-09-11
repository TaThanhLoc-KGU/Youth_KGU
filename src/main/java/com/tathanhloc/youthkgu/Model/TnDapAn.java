package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

/** Một lựa chọn đáp án của câu hỏi. */
@Entity
@Table(name = "tn_dap_an", indexes = { @Index(name = "idx_tn_da_ch", columnList = "cau_hoi_id") })
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TnDapAn {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cau_hoi_id", nullable = false)
    private TnCauHoi cauHoi;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Builder.Default
    @Column(name = "dung", nullable = false)
    private Boolean dung = false;

    @Builder.Default
    @Column(name = "thu_tu", nullable = false)
    private Integer thuTu = 0;

    @Column(name = "hinh_anh", length = 500)
    private String hinhAnh;
}
