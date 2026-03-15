package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ad_banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdBanner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tieuDe;

    @Column(columnDefinition = "TEXT")
    private String hinhAnh;   // URL ảnh

    @Column(columnDefinition = "TEXT")
    private String duongDan;  // URL đích khi click

    /**
     * Loại banner: MAIN (banner ngang giữa trang) hoặc SIDEBAR (widget bên phải)
     */
    @Column(nullable = false)
    private String loai = "MAIN";  // MAIN | SIDEBAR

    @Column(nullable = false)
    private int thuTu = 0;

    @Column(nullable = false)
    private boolean isActive = true;
}
