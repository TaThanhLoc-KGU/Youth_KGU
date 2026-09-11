package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.DoKhoCauHoiEnum;
import com.tathanhloc.youthkgu.Enum.LoaiCauHoiEnum;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Câu hỏi trong ngân hàng câu hỏi (dùng chung cho nhiều đề). */
@Entity
@Table(name = "tn_cau_hoi", indexes = {
        @Index(name = "idx_tn_ch_boc", columnList = "is_active,do_kho,danh_muc_id")
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TnCauHoi {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai", nullable = false, length = 20)
    @Builder.Default
    private LoaiCauHoiEnum loai = LoaiCauHoiEnum.MOT_DAP_AN;

    @Enumerated(EnumType.STRING)
    @Column(name = "do_kho", nullable = false, length = 15)
    @Builder.Default
    private DoKhoCauHoiEnum doKho = DoKhoCauHoiEnum.TRUNG_BINH;

    @Column(name = "danh_muc_id")
    private Long danhMucId;

    @Column(name = "diem", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal diem = BigDecimal.ONE;

    @Column(name = "giai_thich", columnDefinition = "TEXT")
    private String giaiThich;

    @Column(name = "hinh_anh", length = 500)
    private String hinhAnh;

    @Column(name = "ma_khoa", length = 50, columnDefinition = "VARCHAR(50) COLLATE utf8mb4_unicode_ci")
    private String maKhoa;

    /** Soft-delete: câu hỏi đã dùng trong đề/lượt thi KHÔNG được xoá cứng. */
    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "cauHoi", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("thuTu ASC")
    @Builder.Default
    private List<TnDapAn> dapAns = new ArrayList<>();
}
