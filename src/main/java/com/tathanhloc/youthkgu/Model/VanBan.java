package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.HieuLucVanBan;
import com.tathanhloc.youthkgu.Enum.LoaiVanBan;
import com.tathanhloc.youthkgu.Enum.TrangThaiVanBan;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Kho văn bản / kế hoạch / công văn.
 * Quy tắc VB-001: một khi trang_thai = PUBLISHED thì bất biến (enforce ở Service).
 */
@Entity
@Table(name = "van_ban")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VanBan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "so_hieu", length = 100)
    private String soHieu;

    @Column(name = "trich_yeu", nullable = false, length = 1000)
    private String trichYeu;

    @Column(nullable = false, unique = true, length = 500)
    private String slug;

    @Column(name = "full_url_path", nullable = false, unique = true, length = 1000)
    private String fullUrlPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_van_ban", nullable = false)
    private LoaiVanBan loaiVanBan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chuyen_muc_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ChuyenMuc chuyenMuc;

    @Column(name = "co_quan_ban_hanh", length = 200)
    private String coQuanBanHanh;

    @Column(name = "nguoi_ky", length = 200)
    private String nguoiKy;

    @Column(name = "ngay_ban_hanh")
    private LocalDate ngayBanHanh;

    @Column(name = "ngay_hieu_luc")
    private LocalDate ngayHieuLuc;

    @Column(name = "ngay_het_han")
    private LocalDate ngayHetHan;

    @Column(name = "hoat_dong_id", length = 50)
    private String hoatDongId;  // FK mềm → hoat_dong.ma_hoat_dong

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    @Builder.Default
    private TrangThaiVanBan trangThai = TrangThaiVanBan.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "hieu_luc", nullable = false)
    @Builder.Default
    private HieuLucVanBan hieuLuc = HieuLucVanBan.CON_HIEU_LUC;

    @Column(name = "nguoi_dang", nullable = false, length = 50)
    private String nguoiDang;   // FK mềm → tai_khoan.username

    @Column(name = "don_vi_dang", length = 100)
    private String donViDang;

    @Column(name = "luot_xem")
    @Builder.Default
    private Integer luotXem = 0;

    @Column(name = "luot_tai")
    @Builder.Default
    private Integer luotTai = 0;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    // 1 văn bản = 1 file duy nhất (VB-002)
    @OneToOne(mappedBy = "vanBan", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VanBanFile file;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
