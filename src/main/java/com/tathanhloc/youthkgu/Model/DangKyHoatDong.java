package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
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

    @ManyToOne
    @MapsId("maSv")
    @JoinColumn(name = "ma_sv")
    private SinhVien sinhVien;

    @ManyToOne
    @MapsId("maHoatDong")
    @JoinColumn(name = "ma_hoat_dong")
    private HoatDong hoatDong;

    @Column(name = "ma_qr", unique = true)
    private String maQR;

    @Column(name = "trang_thai") // DA_DANG_KY, DA_CHECK_IN, DA_CHECK_OUT, HUY
    private String trangThai;

    @Column(name = "ghi_chu")
    private String ghiChu;

    @Column(name = "da_xac_nhan")
    @Builder.Default
    private Boolean daXacNhan = false;

    @Column(name = "qr_code_image_path")
    private String qrCodeImagePath;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "ngay_dang_ky")
    private LocalDateTime ngayDangKy;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void generateQRCode() {
        if (this.maQR == null && this.id != null) {
            this.maQR = this.id.getMaHoatDong() + this.id.getMaSv();
        }
    }
}