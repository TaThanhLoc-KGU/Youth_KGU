package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "bch_doan_hoi")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BCHDoanHoi {

    @Id
    @Column(name = "ma_bch")
    private String maBch;

    @Column(name = "ho_ten", nullable = false)
    private String hoTen;

    @Column(name = "gioi_tinh")
    private String gioiTinh;

    @Column(name = "ngay_sinh")
    private LocalDate ngaySinh;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "sdt")
    private String sdt;

    @Column(name = "chuc_vu")
    private String chucVu;

    @Column(name = "nhiem_vu")
    private String nhiemVu;

    @ManyToOne
    @JoinColumn(name = "ma_khoa")
    private Khoa khoa;

    @Column(name = "hinh_anh")
    private String hinhAnh;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}