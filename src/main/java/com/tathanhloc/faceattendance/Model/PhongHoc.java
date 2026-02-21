package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "phonghoc")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhongHoc {

    @Id
    @Column(name = "ma_phong")
    private String maPhong;

    @Column(name = "ten_phong", nullable = false)
    private String tenPhong;

    @Column(name = "loai_phong")
    private String loaiPhong;

    @Column(name = "suc_chua")
    private Integer sucChua;

    @Column(name = "toa_nha")
    private String toaNha;

    @Column(name = "tang")
    private Integer tang;

    @Column(name = "trang_thai")
    private String trangThai;

    @Column(name = "vi_tri")
    private String viTri;

    @Column(name = "thiet_bi", columnDefinition = "TEXT")
    private String thietBi;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}