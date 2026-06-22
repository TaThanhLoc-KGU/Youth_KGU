package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Bộ quyền mặc định theo vai trò.
 * Khi không có override trong tai_khoan_quyen, quyền này áp dụng tự động.
 */
@Entity
@Table(name = "role_default_permissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"vai_tro", "permission_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDefaultPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vai_tro", nullable = false, length = 50)
    private String vaiTro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
