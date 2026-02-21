package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.ChuyenVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChuyenVienRepository extends JpaRepository<ChuyenVien, String> {

    List<ChuyenVien> findByIsActiveTrueOrderByHoTenAsc();

    Optional<ChuyenVien> findByEmail(String email);

    boolean existsByEmail(String email);

    List<ChuyenVien> findByKhoaMaKhoaAndIsActiveTrueOrderByHoTenAsc(String maKhoa);

    @Query("SELECT COUNT(cv) FROM ChuyenVien cv WHERE cv.isActive = true")
    long countActive();

    @Query("SELECT cv FROM ChuyenVien cv WHERE cv.isActive = true " +
            "AND (LOWER(cv.maChuyenVien) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(cv.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(cv.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY cv.hoTen ASC")
    List<ChuyenVien> searchByKeyword(@Param("keyword") String keyword);
}