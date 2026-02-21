package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chuyenvien")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChuyenVien {

    @Id
    @Column(name = "ma_chuyen_vien", length = 50)
    private String maChuyenVien;

    @Column(name = "ho_ten", nullable = false, length = 100)
    private String hoTen;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "sdt", length = 15)
    private String sdt;

    @Column(name = "chuc_danh", length = 100)
    private String chucDanh;

    @ManyToOne
    @JoinColumn(name = "ma_khoa")
    private Khoa khoa;

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