package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DiemRenLuyen;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiemRenLuyenRepository extends JpaRepository<DiemRenLuyen, Long> {

    Optional<DiemRenLuyen> findByMaSvAndMaHocKy(String maSv, String maHocKy);

    List<DiemRenLuyen> findByMaSvOrderByMaHocKyDesc(String maSv);

    List<DiemRenLuyen> findByMaHocKy(String maHocKy);

    @Query("SELECT d FROM DiemRenLuyen d WHERE d.maHocKy = :maHocKy " +
           "AND (:trangThai IS NULL OR d.trangThai = :trangThai)")
    Page<DiemRenLuyen> findByHocKyPaged(@Param("maHocKy") String maHocKy,
                                        @Param("trangThai") String trangThai,
                                        Pageable pageable);

    boolean existsByMaSvAndMaHocKy(String maSv, String maHocKy);
}
