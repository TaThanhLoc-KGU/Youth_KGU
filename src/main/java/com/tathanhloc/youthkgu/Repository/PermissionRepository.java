package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    List<Permission> findByCategory(String category);
    Optional<Permission> findByName(String name);
}
