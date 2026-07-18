package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "diem_ren_luyen",
        uniqueConstraints = @UniqueConstraint(columnNames = {"ma_sv", "ma_hoc_ky"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemRenLuyen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_sv", nullable = false, length = 50)
    private String maSv;

    @Column(name = "ma_hoc_ky", nullable = false, length = 20)
    private String maHocKy;

    /** FK → drl_mau_danh_gia.id — mẫu đánh giá được dùng để chấm */
    @Column(name = "mau_id", nullable = false)
    private Long mauId;

    /** JSON text: {"1.1":15,"1.2":3,"2.1":10,...} */
    @Column(name = "scores", columnDefinition = "TEXT")
    private String scores;

    @Column(name = "tong_diem", nullable = false)
    @Builder.Default
    private Integer tongDiem = 0;

    /** XUAT_SAC | TOT | KHA | TRUNG_BINH | YEU | KEM */
    @Column(name = "xep_loai", length = 20)
    private String xepLoai;

    /** NHAP | DA_DUYET | KHOA */
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private String trangThai = "NHAP";

    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "nguoi_tao", length = 100)
    private String nguoiTao;

    @Column(name = "nguoi_cap_nhat", length = 100)
    private String nguoiCapNhat;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
