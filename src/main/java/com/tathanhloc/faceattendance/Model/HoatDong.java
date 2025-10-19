package com.tathanhloc.faceattendance.Model;

import com.tathanhloc.faceattendance.Enum.LoaiHoatDongEnum;
import com.tathanhloc.faceattendance.Enum.TrangThaiHoatDongEnum;
import com.tathanhloc.faceattendance.Enum.CapDoEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "hoat_dong")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoatDong {

    @Id
    @Column(name = "ma_hoat_dong")
    private String maHoatDong;

    @Column(name = "ten_hoat_dong", nullable = false)
    private String tenHoatDong;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_hoat_dong", nullable = false)
    private LoaiHoatDongEnum loaiHoatDong;

    @Enumerated(EnumType.STRING)
    @Column(name = "cap_do", nullable = false)
    @Builder.Default
    private CapDoEnum capDo = CapDoEnum.TRUONG;

    @Column(name = "ngay_to_chuc", nullable = false)
    private LocalDate ngayToChuc;

    @Column(name = "thoi_gian_bat_dau")
    private LocalDateTime thoiGianBatDau;

    @Column(name = "thoi_gian_ket_thuc")
    private LocalDateTime thoiGianKetThuc;

    /**
     * ★ MỚI: Thời gian cho phép check-in sớm (phút)
     * VD: 30 phút trước giờ bắt đầu
     */
    @Column(name = "cho_phep_check_in_som")
    @Builder.Default
    private Integer choPhepCheckInSom = 30;

    /**
     * ★ MỚI: Thời gian tối đa check-in muộn (phút)
     * VD: 15 phút sau giờ bắt đầu vẫn tính đúng giờ
     */
    @Column(name = "thoi_gian_tre_toi_da")
    @Builder.Default
    private Integer thoiGianTreToiDa = 15;

    /**
     * ★ MỚI: Yêu cầu check-out không
     */
    @Column(name = "yeu_cau_check_out")
    @Builder.Default
    private Boolean yeuCauCheckOut = false;

    /**
     * ★ MỚI: Thời gian tối thiểu tham gia (phút)
     * Để tính giờ phục vụ cộng đồng
     */
    @Column(name = "thoi_gian_toi_thieu")
    @Builder.Default
    private Integer thoiGianToiThieu = 60;

    @Column(name = "dia_diem")
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

    @Column(name = "hinh_anh_poster")
    private String hinhAnhPoster;

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