package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable @Data @NoArgsConstructor @AllArgsConstructor
public class RolePermissionId implements Serializable {
    @Column(name = "role_name") private String roleName;
    @Column(name = "permission_id") private Long permissionId;
}
