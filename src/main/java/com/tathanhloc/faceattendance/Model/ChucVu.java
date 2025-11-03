package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chuc_vu")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChucVu {

    @Id
    @Column(name = "ma_chuc_vu", length = 20)
    private String maChucVu; // CV001, CV002...

    @Column(name = "ten_chuc_vu", nullable = false, length = 100)
    private String tenChucVu; // "Bí thư Đoàn", "Chủ tịch HSV"...

    @Column(name = "thuoc_ban", length = 50)
    private String thuocBan; // "DOAN", "HOI", "BAN_PHUC_VU"

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "thu_tu")
    private Integer thuTu; // Thứ tự hiển thị

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}