package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "chung_nhan_hoat_dong")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChungNhanHoatDong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_chung_nhan", unique = true, nullable = false, length = 50)
    private String maChungNhan;

    @ManyToOne
    @JoinColumn(name = "ma_sv", nullable = false)
    private SinhVien sinhVien;

    @ManyToOne
    @JoinColumn(name = "ma_hoat_dong", nullable = false)
    private HoatDong hoatDong;

    @Column(name = "ngay_cap", nullable = false)
    private LocalDate ngayCap;

    @Column(name = "noi_dung", columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
