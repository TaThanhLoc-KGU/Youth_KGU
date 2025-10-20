package com.tathanhloc.faceattendance.Model;

import com.tathanhloc.faceattendance.Enum.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "hoat_dong")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoatDong {

    @Id
    @Column(name = "ma_hoat_dong", length = 20)
    private String maHoatDong;

    @Column(name = "ten_hoat_dong", nullable = false, length = 200)
    private String tenHoatDong;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_hoat_dong", nullable = false)
    private LoaiHoatDongEnum loaiHoatDong;

    @Enumerated(EnumType.STRING)
    @Column(name = "cap_do", nullable = false)
    private CapDoEnum capDo;

    @Column(name = "ngay_to_chuc", nullable = false)
    private LocalDate ngayToChuc;

    @Column(name = "gio_to_chuc")
    private LocalTime gioToChuc;

    // ========== TIME TRACKING FIELDS ==========

    /**
     * Thời gian bắt đầu hoạt động (check-in window opens)
     * VD: 07:00 - Bắt đầu cho phép check-in
     */
    @Column(name = "thoi_gian_bat_dau")
    private LocalTime thoiGianBatDau;

    /**
     * Thời gian kết thúc hoạt động (check-out deadline)
     * VD: 17:00 - Phải check-out trước giờ này
     */
    @Column(name = "thoi_gian_ket_thuc")
    private LocalTime thoiGianKetThuc;

    /**
     * Thời gian trễ tối đa (phút)
     * VD: 15 - Cho phép check-in trễ tối đa 15 phút
     */
    @Column(name = "thoi_gian_tre_toi_da")
    private Integer thoiGianTreToiDa;

    /**
     * Thời gian tối thiểu tham gia (phút)
     * VD: 120 - Phải tham gia ít nhất 2 giờ
     */
    @Column(name = "thoi_gian_toi_thieu")
    private Integer thoiGianToiThieu;

    // ========== BASIC FIELDS ==========

    @Column(name = "dia_diem", length = 200)
    private String diaDiem;

    @ManyToOne
    @JoinColumn(name = "ma_phong")
    private PhongHoc phongHoc;

    @Column(name = "so_luong_toi_da")
    private Integer soLuongToiDa;

    @Column(name = "diem_ren_luyen")
    private Integer diemRenLuyen;

    @ManyToOne
    @JoinColumn(name = "ma_bch_phu_trach")
    private BCHDoanHoi nguoiPhuTrach;

    @ManyToOne
    @JoinColumn(name = "ma_khoa")
    private Khoa khoa;

    @ManyToOne
    @JoinColumn(name = "ma_nganh")
    private Nganh nganh;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    @Builder.Default
    private TrangThaiHoatDongEnum trangThai = TrangThaiHoatDongEnum.SAP_DIEN_RA;

    @Column(name = "yeu_cau_diem_danh")
    @Builder.Default
    private Boolean yeuCauDiemDanh = true;

    @Column(name = "cho_phep_dang_ky")
    @Builder.Default
    private Boolean choPhepDangKy = true;

    @Column(name = "han_dang_ky")
    private LocalDateTime hanDangKy;

    @Column(name = "hinh_anh_poster", length = 500)
    private String hinhAnhPoster;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}