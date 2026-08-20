package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.LoaiChuKy;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chu_ky")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChuKy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_nguoi_ky", nullable = false, length = 255)
    private String tenNguoiKy;

    @Column(name = "chuc_vu", length = 100)
    private String chucVu;

    @Column(name = "duong_dan", nullable = false, length = 500)
    private String duongDan;

    @Column(name = "la_mac_dinh")
    @Builder.Default
    private Boolean laMacDinh = false;

    /** Username của người sở hữu chữ ký. NULL = chữ ký hệ thống (cũ). */
    @Column(name = "owner_username", length = 100)
    private String ownerUsername;

    /** FULL = chữ ký đầy đủ (trang cuối) | NHAY = ký nháy (mọi trang trừ trang cuối). */
    @Enumerated(EnumType.STRING)
    @Column(name = "loai_chu_ky", length = 20, nullable = false)
    @Builder.Default
    private LoaiChuKy loaiChuKy = LoaiChuKy.FULL;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
