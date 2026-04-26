package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dang_ky_thanh_vien_clb")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DangKyThanhVienCLB {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_clb", nullable = false)
    private CauLacBo cauLacBo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_sv", nullable = false)
    private SinhVien sinhVien;

    /** CHO_DUYET | DA_DUYET | TU_CHOI | HUY */
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private String trangThai = "CHO_DUYET";

    @Column(name = "ly_do_dang_ky", columnDefinition = "TEXT")
    private String lyDoDangKy;

    @Column(name = "ly_do_xu_ly", length = 500)
    private String lyDoXuLy;

    @Column(name = "nguoi_xu_ly", length = 100)
    private String nguoiXuLy;

    @Column(name = "ngay_xu_ly")
    private LocalDateTime ngayXuLy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }
}
