package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "danh_sach_ban_hanh")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DanhSachBanHanh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_hoat_dong", nullable = false)
    private String maHoatDong;

    @Column(name = "ten_hoat_dong")
    private String tenHoatDong;

    @Column(name = "ma_khoa")
    private String maKhoa;

    @Column(name = "loai_ky")
    private String loaiKy;

    @Column(name = "ten_nguoi_ky")
    private String tenNguoiKy;

    @Column(name = "ten_nguoi_lap")
    private String tenNguoiLap;

    @Column(name = "chuc_vu_nguoi_lap")
    private String chucVuNguoiLap;

    @Column(name = "co_con_dau")
    private Boolean coConDau;

    @Column(name = "tong_sv")
    private Integer tongSv;

    @Column(name = "ten_file")
    private String tenFile;

    @Column(name = "duong_dan_file")
    private String duongDanFile;

    @Column(name = "nguoi_ban_hanh")
    private String nguoiBanHanh;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** HIEU_LUC = còn hiệu lực, DA_HUY = đã bị hủy (soft-delete) */
    @Column(name = "trang_thai", nullable = false)
    @Builder.Default
    private String trangThai = "HIEU_LUC";

    @Column(name = "ngay_huy")
    private LocalDateTime ngayHuy;

    @Column(name = "nguoi_huy")
    private String nguoiHuy;

    @Column(name = "so_luot_tai", nullable = false)
    @Builder.Default
    private Integer soLuotTai = 0;
}
