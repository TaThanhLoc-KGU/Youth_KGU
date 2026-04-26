package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "clb_cau_hinh")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ClbCauHinh {

    @Id
    @Column(name = "ma_clb")
    private String maClb;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "ma_clb")
    private CauLacBo cauLacBo;

    // ── Cơ chế thành viên ─────────────────────────────────────
    /** TU_DO | YEU_CAU_HOAT_DONG | YEU_CAU_DONG_PHI | YEU_CAU_CA_HAI */
    @Column(name = "co_che_thanh_vien", nullable = false, length = 30)
    @Builder.Default
    private String cocheThanHVien = "TU_DO";

    @Column(name = "so_hoat_dong_toi_thieu")
    private Integer soHoatDongToiThieu;

    // ── Phí ───────────────────────────────────────────────────
    @Column(name = "so_tien_phi_ky", precision = 12, scale = 0)
    @Builder.Default
    private BigDecimal soTienPhiKy = BigDecimal.valueOf(50000);

    /** KY | NAM | THANG */
    @Column(name = "don_vi_phi", length = 10)
    @Builder.Default
    private String donViPhi = "KY";

    // ── Đăng ký tự do ─────────────────────────────────────────
    @Column(name = "cho_phep_dang_ky_tu_do", nullable = false)
    @Builder.Default
    private Boolean choPhepDangKyTuDo = true;

    @Column(name = "can_duyet_dang_ky", nullable = false)
    @Builder.Default
    private Boolean canDuyetDangKy = true;

    @Column(name = "so_thanh_vien_toi_da")
    private Integer soThanhVienToiDa;

    // ── Ngân hàng / webhook ────────────────────────────────────
    @Column(name = "bank_account_no", length = 30)
    private String bankAccountNo;

    @Column(name = "bank_name", length = 50)
    private String bankName;

    @Column(name = "account_name", length = 200)
    private String accountName;

    @Column(name = "ma_xac_thuc_ck", length = 100)
    private String maXacThucCk;

    @Column(name = "webhook_secret", length = 200)
    private String webhookSecret;

    @Column(name = "webhook_provider", length = 20)
    @Builder.Default
    private String webhookProvider = "CASSO";

    // ── Mô tả yêu cầu ─────────────────────────────────────────
    @Column(name = "mo_ta_yeu_cau", columnDefinition = "TEXT")
    private String moTaYeuCau;

    // ── Audit ──────────────────────────────────────────────────
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist
    void prePersist() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }
}
