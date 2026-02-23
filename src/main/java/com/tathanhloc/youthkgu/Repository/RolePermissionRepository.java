package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.RolePermission;
import com.tathanhloc.youthkgu.Model.RolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermissionId> {
    @Query(value = "SELECT permission_id FROM role_permissions WHERE role_name = :roleName", nativeQuery = true)
    List<Long> findPermissionIdsByRole(@Param("roleName") String roleName);

    @Modifying
    @Query(value = "DELETE FROM role_permissions WHERE role_name = :roleName", nativeQuery = true)
    void deleteByRoleName(@Param("roleName") String roleName);

    @Modifying
    @Query(value = "INSERT IGNORE INTO role_permissions (role_name, permission_id) VALUES (:roleName, :permissionId)", nativeQuery = true)
    void insertRolePermission(@Param("roleName") String roleName, @Param("permissionId") Long permissionId);
}
