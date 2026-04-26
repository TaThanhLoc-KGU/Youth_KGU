package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dong_phi_clb")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DongPhiCLB {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_clb", nullable = false)
    private CauLacBo cauLacBo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_sv", nullable = false)
    private SinhVien sinhVien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_hoc_ky")
    private HocKy hocKy;

    @Column(name = "so_tien", nullable = false)
    private BigDecimal soTien;

    /** CHUA_DONG | DA_DONG | MIEN_GIAM | QUA_HAN */
    @Column(name = "trang_thai", nullable = false, length = 20)
    private String trangThai = "CHUA_DONG";

    /** TIEN_MAT | CHUYEN_KHOAN | WEBHOOK_AUTO */
    @Column(name = "hinh_thuc", length = 30)
    private String hinhThuc;

    @Column(name = "ngay_dong")
    private LocalDate ngayDong;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;

    // ── Webhook / tự động ──────────────────────────────────────────
    @Column(name = "transaction_id", length = 150, unique = true)
    private String transactionId;

    @Column(name = "noi_dung_ck", length = 500)
    private String noiDungCk;

    @Column(name = "so_tien_ck")
    private BigDecimal soTienCk;

    /** MANUAL | CASSO | SEPAY */
    @Column(name = "nguon", length = 30)
    private String nguon = "MANUAL";

    // ── Audit ──────────────────────────────────────────────────────
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist
    void prePersist() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }
}
