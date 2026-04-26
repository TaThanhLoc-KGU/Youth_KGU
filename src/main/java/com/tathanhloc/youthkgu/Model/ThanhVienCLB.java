package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "thanh_vien_clb",
       uniqueConstraints = @UniqueConstraint(
           name = "uq_tv_clb_sv_hk",
           columnNames = {"ma_clb", "ma_sv", "ma_hoc_ky"}
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThanhVienCLB {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_clb", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private CauLacBo cauLacBo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_sv", nullable = false)
    private SinhVien sinhVien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_hoc_ky")
    private HocKy hocKy;

    /**
     * Chức vụ trong CLB:
     * CHU_NHIEM | PHO_CHU_NHIEM | THANH_VIEN | CO_VAN | BAN_QUAN_LY
     */
    @Column(name = "chuc_vu", length = 30)
    @Builder.Default
    private String chucVu = "THANH_VIEN";

    @Column(name = "ngay_tham_gia")
    private LocalDate ngayThamGia;

    @Column(name = "ngay_roi_clb")
    private LocalDate ngayRoiClb;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
