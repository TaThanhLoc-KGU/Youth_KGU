package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "chung_nhan_hoat_dong")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChungNhanHoatDong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_chung_nhan", unique = true)
    private String maChungNhan;

    @ManyToOne
    @JoinColumn(name = "ma_sv", nullable = false)
    private SinhVien sinhVien;

    @ManyToOne
    @JoinColumn(name = "ma_hoat_dong", nullable = false)
    private HoatDong hoatDong;

    @Column(name = "ngay_cap")
    private LocalDate ngayCap;

    @Column(name = "noi_dung_chung_nhan", columnDefinition = "TEXT")
    private String noiDungChungNhan;

    @ManyToOne
    @JoinColumn(name = "ma_bch_ky")
    private BCHDoanHoi nguoiKy;

    /**
     * ★ MỚI: Số giờ phục vụ được ghi nhận
     */
    @Column(name = "so_gio_phuc_vu")
    private Double soGioPhucVu;

    @Column(name = "file_pdf")
    private String filePdf;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
