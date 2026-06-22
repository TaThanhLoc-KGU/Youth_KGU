package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.RoleDefaultPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Repository
public interface RoleDefaultPermissionRepository extends JpaRepository<RoleDefaultPermission, Long> {

    @Query("SELECT r.permission.name FROM RoleDefaultPermission r WHERE r.vaiTro = :vaiTro")
    Set<String> findPermissionNamesByVaiTro(@Param("vaiTro") String vaiTro);

    @Query("SELECT r.permission.id FROM RoleDefaultPermission r WHERE r.vaiTro = :vaiTro")
    List<Long> findPermissionIdsByVaiTro(@Param("vaiTro") String vaiTro);

    @Query("SELECT r FROM RoleDefaultPermission r WHERE r.vaiTro = :vaiTro")
    List<RoleDefaultPermission> findByVaiTro(@Param("vaiTro") String vaiTro);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RoleDefaultPermission r WHERE r.vaiTro = :vaiTro")
    void deleteByVaiTro(@Param("vaiTro") String vaiTro);

    @Query("SELECT DISTINCT r.vaiTro FROM RoleDefaultPermission r")
    List<String> findDistinctVaiTro();
}
