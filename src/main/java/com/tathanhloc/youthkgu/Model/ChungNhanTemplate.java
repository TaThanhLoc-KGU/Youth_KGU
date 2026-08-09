package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Mẫu chứng nhận: 1 ảnh nền + danh sách trường nội dung (vị trí/kích thước/font) đặt lên ảnh.
 * fieldsJson lưu List&lt;ChungNhanTemplateFieldDTO&gt; serialize bằng Jackson (xem ChungNhanTemplateService)
 * — không dùng cột JSON đặc thù của Hibernate để tránh phụ thuộc version, nhất quán với cách
 * codebase này xử lý các blob cấu hình khác (colConfig/formatConfig ở tính năng ban hành PDF).
 */
@Entity
@Table(name = "chung_nhan_template")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChungNhanTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten", nullable = false, length = 255)
    private String ten;

    @Column(name = "hinh_nen", nullable = false, length = 500)
    private String hinhNen;

    @Column(name = "chieu_rong_px", nullable = false)
    private Integer chieuRongPx;

    @Column(name = "chieu_cao_px", nullable = false)
    private Integer chieuCaoPx;

    @Column(name = "fields", columnDefinition = "TEXT")
    private String fieldsJson;

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
