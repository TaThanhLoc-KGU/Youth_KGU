package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "con_dau")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConDau {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten", nullable = false, length = 255)
    private String ten;

    @Column(name = "duong_dan", nullable = false, length = 500)
    private String duongDan;

    @Column(name = "la_mac_dinh")
    @Builder.Default
    private Boolean laMacDinh = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
