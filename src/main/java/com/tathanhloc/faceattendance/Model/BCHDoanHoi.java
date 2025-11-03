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
    private String maBch; // BCHKGU0001, BCHKGU0002...

    @OneToOne  // ← THAY ĐỔI: Liên kết với SinhVien
    @JoinColumn(name = "ma_sv", nullable = false)
    private SinhVien sinhVien;

    // XÓA: chucVu field (vì giờ dùng bảng trung gian)
    // XÓA: hoTen, email (lấy từ SinhVien)

    @Column(name = "nhiem_ky", length = 20)
    private String nhiemKy; // "2023-2024"

    @Column(name = "ngay_bat_dau")
    private LocalDate ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDate ngayKetThuc;

    @Column(name = "hinh_anh", length = 255)
    private String hinhAnh;

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