package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Biểu mẫu — file tải về (form mẫu, đơn từ, ...).
 * Đơn giản hơn VanBan: chỉ cần tên hiển thị + đường dẫn file.
 */
@Entity
@Table(name = "bieu_mau")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BieuMau {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String ten;           // Tên hiển thị

    @Column(name = "duong_dan", nullable = false, columnDefinition = "TEXT")
    private String duongDan;      // Đường dẫn file tương đối

    @Column(name = "loai_file", length = 20)
    private String loaiFile;      // pdf, docx, xlsx, ...

    @Column(name = "kich_thuoc")
    private Long kichThuoc;       // Kích thước file (bytes)

    @Column(name = "thu_tu", nullable = false)
    @Builder.Default
    private int thuTu = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
