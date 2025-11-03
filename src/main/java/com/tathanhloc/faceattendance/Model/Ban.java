package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ban")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ban {

    @Id
    @Column(name = "ma_ban", length = 20)
    private String maBan; // BAN001, BAN002...

    @Column(name = "ten_ban", nullable = false, length = 100)
    private String tenBan; // "Ban Truyền thông - Chuyển đổi số"

    @Column(name = "loai_ban", length = 30)
    private String loaiBan; // "DOAN", "HOI", "DOI_CLB_BAN"

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @ManyToOne
    @JoinColumn(name = "ma_khoa")
    private Khoa khoa; // Ban thuộc khoa nào (nullable)

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}