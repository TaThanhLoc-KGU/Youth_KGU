package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Ban Chủ Nhiệm CLB — quản lý nhân sự BCN theo từng nhiệm kỳ.
 * Tách biệt với thanh_vien_clb để lưu lịch sử nhiệm kỳ độc lập.
 */
@Entity
@Table(name = "ban_chu_nhiem_clb")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanChuNhiemCLB {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_clb", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private CauLacBo cauLacBo;

    /** SV | GV | CV */
    @Column(name = "loai_nguoi", nullable = false, length = 5)
    @Builder.Default
    private String loaiNguoi = "SV";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_sv")
    private SinhVien sinhVien;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_gv")
    private GiangVien giangVien;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_cv")
    private ChuyenVien chuyenVien;

    /** Chủ nhiệm | Phó chủ nhiệm | Ủy viên | Kế toán | Thủ quỹ | ... */
    @Column(name = "chuc_vu", nullable = false, length = 100)
    private String chucVu;

    /** Nhiệm kỳ, VD: "2024-2025" */
    @Column(name = "nhiem_ky", nullable = false, length = 20)
    private String nhiemKy;

    /** DUONG_NHIEM | THOI_CHUC */
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private String trangThai = "DUONG_NHIEM";

    @Column(name = "email_lien_he", length = 100)
    private String emailLienHe;

    @Column(name = "sdt", length = 20)
    private String sdt;

    @Column(name = "ngay_bo_nhiem")
    private LocalDate ngayBoNhiem;

    @Column(name = "ngay_thoi_chuc")
    private LocalDate ngayThoiChuc;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
