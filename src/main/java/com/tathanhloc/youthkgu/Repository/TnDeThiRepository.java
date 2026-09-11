package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.TrangThaiDeThiEnum;
import com.tathanhloc.youthkgu.Model.TnDeThi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TnDeThiRepository extends JpaRepository<TnDeThi, Long> {

    Page<TnDeThi> findByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT d FROM TnDeThi d WHERE d.isActive = true " +
           "AND (:maKhoa IS NULL OR d.maKhoa IS NULL OR d.maKhoa = :maKhoa) " +
           "ORDER BY d.createdAt DESC")
    Page<TnDeThi> findScoped(@Param("maKhoa") String maKhoa, Pageable pageable);

    /** Đề đang mở cho thí sinh (đã xuất bản + còn active). */
    List<TnDeThi> findByTrangThaiAndIsActiveTrueOrderByCreatedAtDesc(TrangThaiDeThiEnum trangThai);
}
