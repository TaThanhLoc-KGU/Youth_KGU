package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Mẫu email hàng loạt — admin soạn sẵn (tiêu đề + nội dung HTML), lưu lại đặt tên để
 * tái sử dụng. Khi soạn 1 email mới, chọn 1 mẫu để nạp vào khung soạn thảo rồi chỉnh sửa
 * tự do trước khi gửi (KHÔNG bắt buộc dùng nguyên văn mẫu — mẫu chỉ là điểm khởi đầu).
 */
@Entity
@Table(name = "email_template")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_mau", nullable = false, length = 200)
    private String tenMau;

    @Column(name = "tieu_de", nullable = false, length = 300)
    private String tieuDe;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "LONGTEXT")
    private String noiDung;

    @Column(name = "nguoi_tao", length = 50)
    private String nguoiTao;

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
