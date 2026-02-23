package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity @Table(name = "role_permissions") @Data @NoArgsConstructor @AllArgsConstructor
public class RolePermission {
    @EmbeddedId private RolePermissionId id;
}
