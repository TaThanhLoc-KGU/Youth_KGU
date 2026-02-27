package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Lưu redirect 301/302 khi đổi tên chuyên mục làm thay đổi full_path_slug.
 * Tự động tạo bởi ChuyenMucService khi update (CM-001).
 */
@Entity
@Table(name = "url_redirect")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UrlRedirect {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "url_cu", nullable = false, unique = true, length = 1000)
    private String urlCu;

    @Column(name = "url_moi", nullable = false, length = 1000)
    private String urlMoi;

    @Column(nullable = false)
    @Builder.Default
    private Integer kieu = 301;     // 301 permanent | 302 temporary

    @Column(name = "ly_do", length = 500)
    private String lyDo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
