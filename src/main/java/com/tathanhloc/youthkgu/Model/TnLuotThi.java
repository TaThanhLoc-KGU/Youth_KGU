package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.TrangThaiLuotThiEnum;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Exam_Attempts — 1 lượt = 1 lần thí sinh bấm "Bắt đầu thi". */
@Entity
@Table(name = "tn_luot_thi",
        uniqueConstraints = @UniqueConstraint(name = "uq_tn_lt", columnNames = {"de_thi_id", "ma_sv", "lan_thu"}),
        indexes = {
                @Index(name = "idx_tn_lt_sv", columnList = "ma_sv,trang_thai"),
                @Index(name = "idx_tn_lt_dt", columnList = "de_thi_id,trang_thai")
        })
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TnLuotThi {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "de_thi_id", nullable = false)
    private Long deThiId;

    @Column(name = "ma_sv", nullable = false, length = 20,
            columnDefinition = "VARCHAR(20) COLLATE utf8mb4_unicode_ci")
    private String maSv;

    @Builder.Default
    @Column(name = "lan_thu", nullable = false)
    private Integer lanThu = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 15)
    @Builder.Default
    private TrangThaiLuotThiEnum trangThai = TrangThaiLuotThiEnum.DANG_LAM;

    @Column(name = "thoi_gian_bat_dau", nullable = false)
    private LocalDateTime thoiGianBatDau;

    /** = thoiGianBatDau + thoiLuongPhut — server tính, là nguồn sự thật cho đồng hồ. */
    @Column(name = "thoi_gian_han_nop", nullable = false)
    private LocalDateTime thoiGianHanNop;

    @Column(name = "thoi_gian_nop")
    private LocalDateTime thoiGianNop;

    @Column(name = "diem", precision = 5, scale = 2)
    private BigDecimal diem;

    @Column(name = "diem_tho", precision = 7, scale = 2)
    private BigDecimal diemTho;

    @Column(name = "tong_diem_toi_da", precision = 7, scale = 2)
    private BigDecimal tongDiemToiDa;

    @Column(name = "so_cau_dung")
    private Integer soCauDung;

    @Column(name = "tong_so_cau", nullable = false)
    private Integer tongSoCau;

    @Column(name = "dat")
    private Boolean dat;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
