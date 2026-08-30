package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.EmailGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailGroupRepository extends JpaRepository<EmailGroup, Long> {

    List<EmailGroup> findByIsActiveTrueOrderByTenNhomAsc();

    /** Nhóm của đúng khoa đang xem + nhóm chung (khoa = null) — dùng cho cán bộ khoa. */
    @Query("SELECT g FROM EmailGroup g WHERE g.isActive = true " +
            "AND (g.khoa.maKhoa = :maKhoa OR g.khoa IS NULL) ORDER BY g.tenNhom ASC")
    List<EmailGroup> findByKhoaScopeOrGlobal(@Param("maKhoa") String maKhoa);
}
