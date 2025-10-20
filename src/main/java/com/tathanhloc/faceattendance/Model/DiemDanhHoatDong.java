package com.tathanhloc.faceattendance.Model;

import com.tathanhloc.faceattendance.Enum.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "diem_danh_hoat_dong")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemDanhHoatDong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_hoat_dong", nullable = false)
    private HoatDong hoatDong;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_sv", nullable = false)
    private SinhVien sinhVien;

    @Column(name = "ma_qr_da_quet", nullable = false, length = 100)
    private String maQRDaQuet;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    @Builder.Default
    private TrangThaiThamGiaEnum trangThai = TrangThaiThamGiaEnum.DANG_KY;

    // ========== CHECK-IN ==========

    @Column(name = "thoi_gian_check_in")
    private LocalDateTime thoiGianCheckIn;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai_check_in")
    private TrangThaiCheckInEnum trangThaiCheckIn;

    @Column(name = "so_phut_tre")
    private Integer soPhutTre;

    // ========== CHECK-OUT ==========

    @Column(name = "thoi_gian_check_out")
    private LocalDateTime thoiGianCheckOut;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai_check_out")
    private TrangThaiCheckOutEnum trangThaiCheckOut;

    @Column(name = "so_phut_ve_som")
    private Integer soPhutVeSom;

    // ========== TIME TRACKING ==========

    @Column(name = "tong_thoi_gian_tham_gia")
    private Integer tongThoiGianThamGia;

    @Column(name = "dat_thoi_gian_toi_thieu")
    private Boolean datThoiGianToiThieu;

    @Column(name = "tinh_gio_phuc_vu")
    @Builder.Default
    private Boolean tinhGioPhucVu = false;

    // ========== VERIFIER ==========

    @ManyToOne
    @JoinColumn(name = "ma_bch_check_in")
    private BCHDoanHoi nguoiCheckIn;

    @ManyToOne
    @JoinColumn(name = "ma_bch_check_out")
    private BCHDoanHoi nguoiCheckOut;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    // ========== GPS & DEVICE ==========

    @Column(name = "thiet_bi_quet", length = 100)
    private String thietBiQuet;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}