package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "dang_ky_hoat_dong")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DangKyHoatDong {

    @EmbeddedId
    private DangKyHoatDongId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maSv")
    @JoinColumn(name = "ma_sv")
    private SinhVien sinhVien;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maHoatDong")
    @JoinColumn(name = "ma_hoat_dong")
    private HoatDong hoatDong;

    @Column(name = "ma_qr", unique = true, nullable = false, length = 100)
    private String maQR;

    @CreationTimestamp
    @Column(name = "ngay_dang_ky", updatable = false)
    private LocalDateTime ngayDangKy;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "da_xac_nhan")
    @Builder.Default
    private Boolean daXacNhan = false;

    @Column(name = "qr_code_image_path")
    private String qrCodeImagePath;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @PrePersist
    public void generateQRCode() {
        if (this.maQR == null && this.id != null) {
            this.maQR = this.id.getMaHoatDong() + this.id.getMaSv();
        }
    }
}