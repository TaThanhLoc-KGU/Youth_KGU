package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bch_doan_hoi")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BCHDoanHoi {

    @Id
    @Column(name = "ma_bch", length = 20)
    private String maBch;

    @Column(name = "ho_ten", nullable = false, length = 100)
    private String hoTen;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "so_dien_thoai", length = 15)
    private String soDienThoai;

    @Column(name = "chuc_vu", length = 50)
    private String chucVu;

    @ManyToOne
    @JoinColumn(name = "ma_khoa")
    private Khoa khoa;

    @Column(name = "nhiem_ky", length = 20)
    private String nhiemKy;

    @Column(name = "ngay_bat_dau")
    private LocalDate ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDate ngayKetThuc;

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