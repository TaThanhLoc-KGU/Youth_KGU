package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TaiKhoanQuyen;
import com.tathanhloc.youthkgu.Model.TaiKhoanQuyenId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaiKhoanQuyenRepository extends JpaRepository<TaiKhoanQuyen, TaiKhoanQuyenId> {

    List<TaiKhoanQuyen> findByTaiKhoanId(Long taiKhoanId);

    @Query("SELECT tkq.quyenId FROM TaiKhoanQuyen tkq WHERE tkq.taiKhoanId = :taiKhoanId")
    List<Long> findQuyenIdsByTaiKhoanId(@Param("taiKhoanId") Long taiKhoanId);

    @Query("SELECT p.name FROM TaiKhoanQuyen tkq JOIN tkq.permission p WHERE tkq.taiKhoanId = :taiKhoanId")
    List<String> findPermissionNamesByTaiKhoanId(@Param("taiKhoanId") Long taiKhoanId);

    @Modifying
    @Query("DELETE FROM TaiKhoanQuyen tkq WHERE tkq.taiKhoanId = :taiKhoanId")
    void deleteByTaiKhoanId(@Param("taiKhoanId") Long taiKhoanId);
}
