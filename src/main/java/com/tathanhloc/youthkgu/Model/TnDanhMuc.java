package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/** Danh mục / chủ đề câu hỏi trắc nghiệm. */
@Entity
@Table(name = "tn_danh_muc")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TnDanhMuc {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten", nullable = false, length = 200)
    private String ten;

    @Column(name = "mo_ta", length = 500)
    private String moTa;

    /** Danh mục cha (phân cấp, tùy chọn). */
    @Column(name = "parent_id")
    private Long parentId;

    /** NULL = dùng chung toàn trường; non-null = của riêng khoa. */
    @Column(name = "ma_khoa", length = 50, columnDefinition = "VARCHAR(50) COLLATE utf8mb4_unicode_ci")
    private String maKhoa;

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
