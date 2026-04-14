package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Bảng gán quyền trực tiếp cho tài khoản QUAN_LY.
 * Mỗi row = 1 quyền được cấp cho 1 tài khoản.
 * Thay thế role_permissions + account_permissions cũ.
 */
@Entity
@Table(name = "tai_khoan_quyen")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(TaiKhoanQuyenId.class)
public class TaiKhoanQuyen {

    @Id
    @Column(name = "tai_khoan_id")
    private Long taiKhoanId;

    @Id
    @Column(name = "quyen_id")
    private Long quyenId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tai_khoan_id", insertable = false, updatable = false)
    private TaiKhoan taiKhoan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quyen_id", insertable = false, updatable = false)
    private Permission permission;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Long createdBy;
}
