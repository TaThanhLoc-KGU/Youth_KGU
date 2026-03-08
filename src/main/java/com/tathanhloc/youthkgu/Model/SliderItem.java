package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "slider_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SliderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tieuDe;

    @Column(columnDefinition = "TEXT")
    private String moTa;

    @Column(columnDefinition = "TEXT")
    private String hinhAnh;   // URL ảnh

    @Column(columnDefinition = "TEXT")
    private String duongDan;  // URL hoặc path nội bộ (không có leading /)

    @Column(nullable = false)
    private int thuTu = 0;

    @Column(nullable = false)
    private boolean isActive = true;
}
