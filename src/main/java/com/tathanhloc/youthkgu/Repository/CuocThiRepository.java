package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.TrangThaiCuocThiEnum;
import com.tathanhloc.youthkgu.Model.CuocThi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CuocThiRepository extends JpaRepository<CuocThi, Long> {

    Optional<CuocThi> findBySlug(String slug);

    List<CuocThi> findByHoatDongMaHoatDongAndIsActiveTrue(String maHoatDong);

    List<CuocThi> findByTrangThaiAndIsActiveTrue(TrangThaiCuocThiEnum trangThai);

    List<CuocThi> findByIsActiveTrueOrderByCreatedAtDesc();

    @Query("SELECT ct FROM CuocThi ct WHERE ct.isActive = true AND ct.trangThai IN ('DANG_MO') ORDER BY ct.createdAt DESC")
    List<CuocThi> findDangMo();

    boolean existsBySlug(String slug);

    // Lọc cuộc thi theo khoa (qua hoatDong.khoa)
    @Query("SELECT c FROM CuocThi c WHERE c.hoatDong.khoa.maKhoa = :maKhoa AND c.isActive = true ORDER BY c.createdAt DESC")
    List<CuocThi> findByHoatDongKhoaMaKhoa(@Param("maKhoa") String maKhoa);

    @Query("SELECT c FROM CuocThi c WHERE c.hoatDong.khoa.maKhoa = :maKhoa AND c.isActive = true AND c.trangThai = :trangThai")
    List<CuocThi> findByHoatDongKhoaMaKhoaAndTrangThai(@Param("maKhoa") String maKhoa, @Param("trangThai") com.tathanhloc.youthkgu.Enum.TrangThaiCuocThiEnum trangThai);
}
