package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.AccountPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountPermissionRepository extends JpaRepository<AccountPermission, Long> {
    List<AccountPermission> findByTaiKhoanId(Long taiKhoanId);
    void deleteByTaiKhoanIdAndPermissionId(Long taiKhoanId, Long permissionId);
    Optional<AccountPermission> findByTaiKhoanIdAndPermissionId(Long taiKhoanId, Long permissionId);
}
