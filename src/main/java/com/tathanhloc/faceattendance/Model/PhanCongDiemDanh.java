package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho phân công người điểm danh cho một hoạt động
 * Một hoạt động có thể có 1 hoặc nhiều người được phân công điểm danh
 */
@Entity
@Table(name = "phan_cong_diem_danh")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhanCongDiemDanh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Hoạt động được phân công
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_hoat_dong", nullable = false)
    private HoatDong hoatDong;

    /**
     * BCH được phân công điểm danh
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_bch", nullable = false)
    private BCHDoanHoi bchPhuTrach;

    /**
     * Vai trò: CHINH (chính) hoặc PHU (phụ)
     * - CHINH: người điểm danh chính
     * - PHU: người điểm danh phụ (hỗ trợ)
     */
    @Column(name = "vai_tro", length = 20, nullable = false)
    private String vaiTro;

    /**
     * Ghi chú về phân công
     */
    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    /**
     * Trạng thái hoạt động
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Ngày phân công
     */
    @CreationTimestamp
    @Column(name = "ngay_phan_cong", updatable = false)
    private LocalDateTime ngayPhanCong;
}
