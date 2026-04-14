package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ky_so_lich_su")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KySoLichSu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_hoat_dong", nullable = false, length = 100)
    private String maHoatDong;

    @Column(name = "ten_hoat_dong", length = 500)
    private String tenHoatDong;

    @Column(name = "loai_ky", length = 50)
    private String loaiKy;

    @Column(name = "ten_nguoi_ky", length = 255)
    private String tenNguoiKy;

    @Column(name = "ten_nguoi_lap", length = 255)
    private String tenNguoiLap;

    @Column(name = "co_con_dau")
    @Builder.Default
    private Boolean coConDau = false;

    @Column(name = "nguoi_thuc_hien", length = 255)
    private String nguoiThucHien;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "ten_file", length = 500)
    private String tenFile;

    @Column(name = "tong_sv")
    @Builder.Default
    private Integer tongSv = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
