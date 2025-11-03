package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "bch_chuc_vu")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BCHChucVu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ma_bch", nullable = false)
    private BCHDoanHoi bch;

    @ManyToOne
    @JoinColumn(name = "ma_chuc_vu", nullable = false)
    private ChucVu chucVu;

    @ManyToOne
    @JoinColumn(name = "ma_ban")
    private Ban ban; // Chức vụ trong ban nào

    @Column(name = "ngay_nhan_chuc")
    private LocalDate ngayNhanChuc;

    @Column(name = "ngay_ket_thuc")
    private LocalDate ngayKetThuc; // nullable

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}