package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.*;
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

    /**
     * Cho phép check-in sớm (phút)
     * VD: 30 - Cho phép check-in sớm 30 phút trước giờ bắt đầu
     */
    @Column(name = "cho_phep_check_in_som")
    @Builder.Default
    private Integer choPhepCheckInSom = 30;

    /**
     * Yêu cầu check-out không
     */
    @Column(name = "yeu_cau_check_out")
    @Builder.Default
    private Boolean yeuCauCheckOut = false;

    // ========== BASIC FIELDS ==========

    @Column(name = "dia_diem", length = 200)
    private String diaDiem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_phong")
    private PhongHoc phongHoc;

    @Column(name = "so_luong_toi_da")
    private Integer soLuongToiDa;

    @Column(name = "diem_ren_luyen")
    private Integer diemRenLuyen;

    /**
     * Mã danh mục điểm rèn luyện (I, II, III, IV, V, VI)
     * Theo quy chế đánh giá rèn luyện sinh viên của trường
     */
    @Column(name = "ma_danh_muc_ren_luyen", length = 10)
    private String maDanhMucRenLuyen;

    /**
     * Mã tiêu chí điểm rèn luyện (1.1, 2.1, 3.4, ...)
     */
    @Column(name = "ma_tieu_chi_ren_luyen", length = 20)
    private String maTieuChiRenLuyen;

    /**
     * Điểm tối đa của tiêu chí được chọn (cache để hiển thị nhanh)
     */
    @Column(name = "diem_toi_da_tieu_chi")
    private Integer diemToiDaTieuChi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_bch_phu_trach")
    private BCHDoanHoi nguoiPhuTrach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_khoa")
    private Khoa khoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nganh")
    private Nganh nganh;

    // ========== HỌC KỲ & NĂM HỌC ==========

    /**
     * Số thứ tự học kỳ trong năm học (1, 2 hoặc 3)
     */
    @Column(name = "so_hoc_ky")
    private Integer soHocKy;

    /**
     * Năm học mà hoạt động thuộc về (FK → nam_hoc)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nam_hoc")
    private NamHoc namHoc;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 50)
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

    // ========== LOCATION FIELDS ==========

    /**
     * Vĩ độ (latitude) địa điểm tổ chức
     */
    @Column(name = "vi_do")
    private Double viDo;

    /**
     * Kinh độ (longitude) địa điểm tổ chức
     */
    @Column(name = "kinh_do")
    private Double kinhDo;

    /**
     * Khoảng cách tối đa cho phép check-in (mét, null = không kiểm tra)
     */
    @Column(name = "khoang_cach_toi_da")
    private Integer khoangCachToiDa;

    // ========== EARLY TERMINATION ==========

    /**
     * Flag kết thúc sớm (default false)
     */
    @Column(name = "ket_thuc_som")
    @Builder.Default
    private Boolean ketThucSom = false;

    /**
     * Thời điểm kết thúc sớm thực tế
     */
    @Column(name = "thoi_gian_ket_thuc_thuc_te")
    private LocalDateTime thoiGianKetThucThucTe;

    /**
     * Số phút cho phép checkout sau khi kết thúc (default 30)
     */
    @Column(name = "thoi_gian_cho_phep_check_out")
    @Builder.Default
    private Integer thoiGianChoPhepCheckOut = 30;

    @Column(name = "hinh_anh_poster", columnDefinition = "LONGTEXT")
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