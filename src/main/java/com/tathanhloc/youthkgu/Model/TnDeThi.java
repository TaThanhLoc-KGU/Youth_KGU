package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.CheDoDeThiEnum;
import com.tathanhloc.youthkgu.Enum.CheDoHienKetQuaEnum;
import com.tathanhloc.youthkgu.Enum.TrangThaiDeThiEnum;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Đề thi / cuộc thi trắc nghiệm + toàn bộ cấu hình. */
@Entity
@Table(name = "tn_de_thi", indexes = {
        @Index(name = "idx_tn_dt_trangthai", columnList = "trang_thai,is_active")
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TnDeThi {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tieu_de", nullable = false, length = 300)
    private String tieuDe;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Enumerated(EnumType.STRING)
    @Column(name = "che_do", nullable = false, length = 15)
    @Builder.Default
    private CheDoDeThiEnum cheDo = CheDoDeThiEnum.CO_DINH;

    /** Gắn hoạt động (tùy chọn) — để sau tích hợp điểm danh / điểm rèn luyện. */
    @Column(name = "ma_hoat_dong", length = 50)
    private String maHoatDong;

    /** Phạm vi dự thi. NULL = toàn trường. */
    @Column(name = "ma_khoa", length = 50, columnDefinition = "VARCHAR(50) COLLATE utf8mb4_unicode_ci")
    private String maKhoa;

    @Builder.Default
    @Column(name = "thoi_luong_phut", nullable = false)
    private Integer thoiLuongPhut = 30;

    @Column(name = "mo_luc")
    private LocalDateTime moLuc;

    @Column(name = "dong_luc")
    private LocalDateTime dongLuc;

    @Builder.Default
    @Column(name = "so_lan_lam_toi_da", nullable = false)
    private Integer soLanLamToiDa = 1;

    @Builder.Default @Column(name = "tron_cau_hoi", nullable = false)
    private Boolean tronCauHoi = true;

    @Builder.Default @Column(name = "tron_dap_an", nullable = false)
    private Boolean tronDapAn = true;

    @Builder.Default @Column(name = "cham_diem_tung_phan", nullable = false)
    private Boolean chamDiemTungPhan = false;

    @Builder.Default
    @Column(name = "thang_diem", nullable = false, precision = 5, scale = 2)
    private BigDecimal thangDiem = new BigDecimal("10.00");

    @Column(name = "diem_dat", precision = 5, scale = 2)
    private BigDecimal diemDat;

    @Enumerated(EnumType.STRING)
    @Column(name = "che_do_hien_ket_qua", nullable = false, length = 20)
    @Builder.Default
    private CheDoHienKetQuaEnum cheDoHienKetQua = CheDoHienKetQuaEnum.NGAY;

    @Builder.Default @Column(name = "cho_xem_lai_bai", nullable = false)
    private Boolean choXemLaiBai = true;

    @Builder.Default @Column(name = "hien_dap_an_dung", nullable = false)
    private Boolean hienDapAnDung = true;

    /** Cache: CO_DINH = số dòng map; NGAU_NHIEN = tổng so_luong ma trận. */
    @Builder.Default
    @Column(name = "tong_so_cau", nullable = false)
    private Integer tongSoCau = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 15)
    @Builder.Default
    private TrangThaiDeThiEnum trangThai = TrangThaiDeThiEnum.NHAP;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
