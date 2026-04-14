package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "thi_sinh")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ThiSinh {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuoc_thi_id", nullable = false)
    private CuocThi cuocThi;

    @Column(name = "ten", nullable = false, length = 200)
    private String ten;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "anh_dai_dien", length = 500)
    private String anhDaiDien;

    @Column(name = "url_media", length = 500)
    private String urlMedia;

    @Column(name = "so_thu_tu")
    @Builder.Default
    private Integer soThuTu = 0;

    @Column(name = "thong_tin_them", columnDefinition = "JSON")
    private String thongTinThem;

    @Column(name = "ma_sv", length = 20)
    private String maSv;

    @Column(name = "so_vote")
    @Builder.Default
    private Integer soVote = 0;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
