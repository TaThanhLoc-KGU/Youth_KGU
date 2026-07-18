package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "drl_mau_danh_gia")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrlMauDanhGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_mau", nullable = false, length = 200)
    private String tenMau;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "nam_hoc", length = 20)
    private String namHoc;

    @Column(name = "phien_ban", nullable = false)
    @Builder.Default
    private Integer phienBan = 1;

    /** NULL = bản gốc; != NULL = clone từ bản cha */
    @Column(name = "mau_cha_id")
    private Long mauChaId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "mau", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("thuTu ASC")
    private List<DrlDanhMuc> danhMucList;
}
