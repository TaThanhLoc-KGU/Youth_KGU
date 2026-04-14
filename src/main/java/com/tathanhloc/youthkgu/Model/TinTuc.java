package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.TrangThaiTinTuc;
import com.tathanhloc.youthkgu.Model.Khoa;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Bài đăng tin tức eNews.
 * Quy tắc TT-002: khi set trangThai = PUBLISHED → tự động set ngayXuatBan = NOW() (enforce ở Service).
 */
@Entity
@Table(name = "tin_tuc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TinTuc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tieu_de", nullable = false, length = 500)
    private String tieuDe;

    @Column(nullable = false, length = 500)
    private String slug;

    @Column(name = "full_url_path", nullable = false, unique = true, length = 1000)
    private String fullUrlPath;

    @Column(name = "tom_tat", columnDefinition = "TEXT")
    private String tomTat;

    @Column(name = "noi_dung", columnDefinition = "LONGTEXT")
    private String noiDung;

    @Column(name = "anh_dai_dien", length = 500)
    private String anhDaiDien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chuyen_muc_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ChuyenMuc chuyenMuc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "van_ban_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VanBan vanBan;      // nullable — liên kết tùy chọn

    @Column(name = "hoat_dong_id", length = 50)
    private String hoatDongId;  // FK mềm → hoat_dong.ma_hoat_dong (TT-001 enforce ở Service)

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    @Builder.Default
    private TrangThaiTinTuc trangThai = TrangThaiTinTuc.DRAFT;

    @Column(name = "is_ghim")
    @Builder.Default
    private Boolean isGhim = false;

    @Column(name = "nguoi_tao", nullable = false, length = 50)
    private String nguoiTao;    // FK mềm → tai_khoan.username

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_khoa")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Khoa khoa;

    @Column(name = "tac_gia", length = 150)
    private String tacGia;      // Tên hiển thị tác giả (ví dụ: "Ban Học thuật KGU")

    @Column(name = "don_vi_dang", length = 100)
    private String donViDang;

    @Column(name = "luot_xem")
    @Builder.Default
    private Integer luotXem = 0;

    @Column(name = "ngay_xuat_ban")
    private LocalDateTime ngayXuatBan;  // Set = NOW() khi PUBLISHED (TT-002)

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @OneToMany(mappedBy = "tinTuc", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("thuTu ASC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<TinTucAnh> anhList;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
