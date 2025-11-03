package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.ChucVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChucVuRepository extends JpaRepository<ChucVu, String> {
    List<ChucVu> findByThuocBanAndIsActiveTrue(String thuocBan);


    List<ChucVu> findByThuocBanAndIsActiveTrueOrderByThuTuAsc(String thuocBan);

    List<ChucVu> findByIsActiveTrueOrderByThuTuAsc();

    boolean existsByTenChucVu(String tenChucVu);

    @Query("SELECT COUNT(cv) FROM ChucVu cv WHERE cv.isActive = true")
    long countActive();

    @Query("SELECT cv.thuocBan, COUNT(cv) FROM ChucVu cv WHERE cv.isActive = true GROUP BY cv.thuocBan")
    List<Object[]> countByThuocBan();
}