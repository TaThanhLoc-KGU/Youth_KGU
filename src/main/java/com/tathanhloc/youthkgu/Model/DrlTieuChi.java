package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "drl_tieu_chi")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrlTieuChi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "danh_muc_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private DrlDanhMuc danhMuc;

    /** 1.1, 1.2, 2.1, ... */
    @Column(name = "ma_tieu_chi", nullable = false, length = 20)
    private String maTieuChi;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "diem_toi_da", nullable = false)
    @Builder.Default
    private Integer diemToiDa = 0;

    /** JSON: sub-items nếu có (VD: KHA/GIOI/XUAT_SAC) */
    @Column(name = "chi_tiet", columnDefinition = "TEXT")
    private String chiTiet;

    @Column(name = "thu_tu", nullable = false)
    @Builder.Default
    private Integer thuTu = 0;
}
