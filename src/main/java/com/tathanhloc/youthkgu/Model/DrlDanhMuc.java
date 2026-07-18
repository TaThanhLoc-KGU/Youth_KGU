package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "drl_danh_muc")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrlDanhMuc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mau_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private DrlMauDanhGia mau;

    /** I, II, III, IV, V, VI */
    @Column(name = "ma_danh_muc", nullable = false, length = 10)
    private String maDanhMuc;

    @Column(name = "ten_danh_muc", nullable = false, length = 500)
    private String tenDanhMuc;

    @Column(name = "diem_toi_da", nullable = false)
    @Builder.Default
    private Integer diemToiDa = 0;

    @Column(name = "thu_tu", nullable = false)
    @Builder.Default
    private Integer thuTu = 0;

    @OneToMany(mappedBy = "danhMuc", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("thuTu ASC")
    private List<DrlTieuChi> tieuChiList;
}
