package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cuoc_thi")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CuocThi {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tieu_de", nullable = false, length = 300)
    private String tieuDe;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "anh_bia", length = 500)
    private String anhBia;

    @Column(name = "slug", nullable = false, unique = true, length = 300)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_cuoc_thi", nullable = false)
    @Builder.Default
    private LoaiCuocThiEnum loaiCuocThi = LoaiCuocThiEnum.TONG_HOP;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_hoat_dong")
    private HoatDong hoatDong;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    @Builder.Default
    private TrangThaiCuocThiEnum trangThai = TrangThaiCuocThiEnum.CHUAN_BI;

    @Enumerated(EnumType.STRING)
    @Column(name = "hien_thi_ket_qua", nullable = false)
    @Builder.Default
    private HienThiKetQuaEnum hienThiKetQua = HienThiKetQuaEnum.REALTIME;

    @Enumerated(EnumType.STRING)
    @Column(name = "dieu_kien_vote", nullable = false)
    @Builder.Default
    private DieuKienVoteEnum dieuKienVote = DieuKienVoteEnum.DANG_NHAP;

    @Enumerated(EnumType.STRING)
    @Column(name = "quy_tac_vote", nullable = false)
    @Builder.Default
    private QuyTacVoteEnum quyTacVote = QuyTacVoteEnum.MOT_LAN;

    @Column(name = "so_luot_toi_da")
    private Integer soLuotToiDa;

    @Column(name = "thoi_gian_mo_vote")
    private LocalDateTime thoiGianMoVote;

    @Column(name = "thoi_gian_dong_vote")
    private LocalDateTime thoiGianDongVote;

    @Builder.Default
    @Column(name = "cho_phep_nop_bai")
    private Boolean choPhepNopBai = false;

    @Column(name = "han_nop")
    private LocalDateTime hanNop;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "cuocThi", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("soThuTu ASC")
    @Builder.Default
    private List<ThiSinh> danhSachThiSinh = new ArrayList<>();
}
