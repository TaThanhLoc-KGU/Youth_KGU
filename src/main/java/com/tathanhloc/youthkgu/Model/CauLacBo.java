package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "cau_lac_bo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CauLacBo {

    @Id
    @Column(name = "ma_clb", length = 20)
    private String maClb;

    @Column(name = "ten_clb", nullable = false, length = 200)
    private String tenClb;

    /** CLB | DOI | NHOM */
    @Column(name = "loai", length = 20)
    @Builder.Default
    private String loai = "CLB";

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "linh_vuc", length = 100)
    private String linhVuc;

    /** null = Đoàn trường / Hội SV cấp trường; non-null = CLB cấp Khoa */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_khoa")
    private Khoa khoa;

    /** Ban/Đội quản lý (có thể null) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_ban")
    private Ban ban;

    /** Trưởng CLB — sinh viên */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "truong_clb_ma_sv")
    private SinhVien truongClb;

    /**
     * ma_tai_khoan của người quản lý CLB (dùng cho giảng viên / chuyên viên làm chủ nhiệm).
     * Với SV chủ nhiệm: sử dụng truongClb (FK → SinhVien) hoặc điền cả hai.
     */
    @Column(name = "ma_quan_ly", length = 50)
    private String maQuanLy;

    @Column(name = "ngay_thanh_lap")
    private LocalDate ngayThanhLap;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Danh sách thành viên (lazy — không load khi list CLB) */
    @OneToMany(mappedBy = "cauLacBo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ThanhVienCLB> thanhViens;
}
