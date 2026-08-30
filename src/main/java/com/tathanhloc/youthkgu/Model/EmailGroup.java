package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Nhóm mail (mail group) dùng để gửi email hàng loạt — mỗi khoa quản lý 1 nhóm riêng
 * (vd: nhóm sinh viên khoa CNTT), hoặc 1 nhóm chung không gắn khoa nào (khoa = null,
 * dùng cho các nhóm cấp trường như "Toàn thể sinh viên"). Việc gửi mail hàng loạt
 * KHÔNG lặp qua từng sinh viên trong DB — chỉ gửi 1 email tới ĐỊA CHỈ NHÓM này, việc
 * phân phối tới từng thành viên do mail server (Google Group/distribution list...) đảm nhiệm.
 */
@Entity
@Table(name = "email_group")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_nhom", nullable = false, length = 200)
    private String tenNhom;

    @Column(name = "dia_chi_email", nullable = false, length = 255)
    private String diaChiEmail;

    /**
     * Null = nhóm chung (không gắn khoa nào), thấy được bởi mọi cấp quản lý.
     * columnDefinition PHẢI khớp chính xác định nghĩa cột khoa.ma_khoa (varchar(50) COLLATE
     * utf8mb4_unicode_ci) — nếu để Hibernate tự suy ra, ddl-auto=update sẽ tạo cột với collation
     * MẶC ĐỊNH của DB (utf8mb4_general_ci trên môi trường này), khác với khoa.ma_khoa, gây lỗi
     * "Illegal mix of collations" ngay khi JOIN 2 bảng (VD: EmailGroupRepository.findByKhoaScopeOrGlobal).
     */
    @ManyToOne
    @JoinColumn(name = "ma_khoa", columnDefinition = "VARCHAR(50) COLLATE utf8mb4_unicode_ci")
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
