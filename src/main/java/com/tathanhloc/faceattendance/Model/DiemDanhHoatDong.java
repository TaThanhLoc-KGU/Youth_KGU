package com.tathanhloc.faceattendance.Model;

import com.tathanhloc.faceattendance.Enum.TrangThaiThamGiaEnum;
import com.tathanhloc.faceattendance.Enum.TrangThaiCheckInEnum;
import com.tathanhloc.faceattendance.Enum.TrangThaiCheckOutEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * ★ CẬP NHẬT: Thêm tính năng check-in/check-out thời gian
 */
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

    // ============ CHECK-IN ============

    /**
     * ★ Thời gian quét QR check-in
     */
    @Column(name = "thoi_gian_check_in")
    private LocalDateTime thoiGianCheckIn;

    /**
     * ★ MỚI: Trạng thái check-in (đúng giờ/trễ)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai_check_in")
    private TrangThaiCheckInEnum trangThaiCheckIn;

    /**
     * ★ MỚI: Số phút trễ (nếu có)
     */
    @Column(name = "so_phut_tre")
    private Integer soPhutTre;

    // ============ CHECK-OUT ============

    /**
     * ★ Thời gian quét QR check-out
     */
    @Column(name = "thoi_gian_check_out")
    private LocalDateTime thoiGianCheckOut;

    /**
     * ★ MỚI: Trạng thái check-out (hoàn thành/về sớm)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai_check_out")
    private TrangThaiCheckOutEnum trangThaiCheckOut;

    /**
     * ★ MỚI: Số phút về sớm (nếu có)
     */
    @Column(name = "so_phut_ve_som")
    private Integer soPhutVeSom;

    // ============ THỜI GIAN THAM GIA ============

    /**
     * ★ MỚI: Tổng thời gian tham gia (phút)
     * = thoiGianCheckOut - thoiGianCheckIn
     */
    @Column(name = "tong_thoi_gian_tham_gia")
    private Integer tongThoiGianThamGia;

    /**
     * ★ MỚI: Có đủ thời gian tối thiểu không
     */
    @Column(name = "dat_thoi_gian_toi_thieu")
    private Boolean datThoiGianToiThieu;

    /**
     * ★ MỚI: Tính vào giờ phục vụ cộng đồng không
     */
    @Column(name = "tinh_gio_phuc_vu")
    @Builder.Default
    private Boolean tinhGioPhucVu = false;

    // ============ NGƯỜI XÁC NHẬN ============

    @ManyToOne
    @JoinColumn(name = "ma_bch_check_in")
    private BCHDoanHoi nguoiCheckIn;

    @ManyToOne
    @JoinColumn(name = "ma_bch_check_out")
    private BCHDoanHoi nguoiCheckOut;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    // ============ METADATA ============

    @Column(name = "thiet_bi_check_in")
    private String thietBiCheckIn;

    @Column(name = "thiet_bi_check_out")
    private String thietBiCheckOut;

    @Column(name = "latitude_check_in")
    private Double latitudeCheckIn;

    @Column(name = "longitude_check_in")
    private Double longitudeCheckIn;

    @Column(name = "latitude_check_out")
    private Double latitudeCheckOut;

    @Column(name = "longitude_check_out")
    private Double longitudeCheckOut;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ============ HELPER METHODS ============

    /**
     * Tự động tính toán các trạng thái khi check-in
     */
    @PreUpdate
    @PostLoad
    public void calculateCheckInStatus() {
        if (thoiGianCheckIn != null && hoatDong != null && hoatDong.getThoiGianBatDau() != null) {
            LocalDateTime gioMoCheckIn = hoatDong.getThoiGianBatDau()
                    .minusMinutes(hoatDong.getChoPhepCheckInSom());
            LocalDateTime gioTreToiDa = hoatDong.getThoiGianBatDau()
                    .plusMinutes(hoatDong.getThoiGianTreToiDa());

            if (thoiGianCheckIn.isAfter(gioTreToiDa)) {
                // Trễ
                trangThaiCheckIn = TrangThaiCheckInEnum.TRE;
                soPhutTre = (int) Duration.between(gioTreToiDa, thoiGianCheckIn).toMinutes();
            } else {
                // Đúng giờ
                trangThaiCheckIn = TrangThaiCheckInEnum.DUNG_GIO;
                soPhutTre = 0;
            }
        }
    }

    /**
     * Tự động tính toán khi check-out
     */
    public void calculateCheckOutStatus() {
        if (thoiGianCheckOut != null && hoatDong != null) {
            // Tính thời gian tham gia
            if (thoiGianCheckIn != null) {
                tongThoiGianThamGia = (int) Duration.between(thoiGianCheckIn, thoiGianCheckOut).toMinutes();

                // Check đủ thời gian tối thiểu không
                if (hoatDong.getThoiGianToiThieu() != null) {
                    datThoiGianToiThieu = tongThoiGianThamGia >= hoatDong.getThoiGianToiThieu();
                }
            }

            // Check về sớm không
            if (hoatDong.getThoiGianKetThuc() != null) {
                if (thoiGianCheckOut.isBefore(hoatDong.getThoiGianKetThuc())) {
                    trangThaiCheckOut = TrangThaiCheckOutEnum.VE_SOM;
                    soPhutVeSom = (int) Duration.between(thoiGianCheckOut, hoatDong.getThoiGianKetThuc()).toMinutes();
                } else {
                    trangThaiCheckOut = TrangThaiCheckOutEnum.HOAN_THANH;
                    soPhutVeSom = 0;
                }
            }

            // Tính vào giờ phục vụ nếu đủ điều kiện
            tinhGioPhucVu = Boolean.TRUE.equals(datThoiGianToiThieu)
                    && trangThai == TrangThaiThamGiaEnum.DA_THAM_GIA;
        }
    }
}