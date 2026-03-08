package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ticker_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TickerItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String noiDung;   // Văn bản chạy chữ

    @Column(columnDefinition = "TEXT")
    private String duongDan;  // URL hoặc path (tuỳ chọn)

    @Column(nullable = false)
    private int thuTu = 0;

    @Column(nullable = false)
    private boolean isActive = true;
}
