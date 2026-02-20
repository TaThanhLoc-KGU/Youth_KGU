package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity @Table(name = "account_permissions")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AccountPermission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tai_khoan_id", nullable = false)
    private TaiKhoan taiKhoan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;

    @Column(name = "is_granted", nullable = false)
    private Boolean isGranted = true; // true=cấp thêm, false=thu hồi

    @Column(name = "granted_by")
    private Long grantedBy;

    @Column(name = "ghi_chu")
    private String ghiChu;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
