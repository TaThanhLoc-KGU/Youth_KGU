package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Ảnh gallery của bài tin tức.
 */
@Entity
@Table(name = "tin_tuc_anh")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TinTucAnh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tin_tuc_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TinTuc tinTuc;

    @Column(name = "duong_dan", nullable = false, length = 1000)
    private String duongDan;

    @Column(name = "ten_file_goc", length = 500)
    private String tenFileGoc;

    @Column(name = "mo_ta", length = 500)
    private String moTa;        // Alt text cho ảnh (SEO)

    @Column(name = "thu_tu")
    @Builder.Default
    private Integer thuTu = 0;

    @CreationTimestamp
    @Column(name = "ngay_upload", updatable = false)
    private LocalDateTime ngayUpload;
}
