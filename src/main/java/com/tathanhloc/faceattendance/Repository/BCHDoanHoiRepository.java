package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.BCHDoanHoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho Ban Chấp Hành Đoàn - Hội
 */
@Repository
public interface BCHDoanHoiRepository extends JpaRepository<BCHDoanHoi, String> {

    // ========== BASIC QUERIES ==========

    Optional<BCHDoanHoi> findByEmail(String email);
    boolean existsByEmail(String email);
    List<BCHDoanHoi> findByIsActive(Boolean isActive);
    long countByIsActiveTrue();

    // ========== SEARCH BY ATTRIBUTES ==========

    List<BCHDoanHoi> findByChucVu(String chucVu);
    List<BCHDoanHoi> findByChucVuAndIsActive(String chucVu, Boolean isActive);
    List<BCHDoanHoi> findByKhoaMaKhoa(String maKhoa);
    List<BCHDoanHoi> findByKhoaMaKhoaAndIsActive(String maKhoa, Boolean isActive);

    // ========== SEARCH & FILTER ==========

    @Query("SELECT b FROM BCHDoanHoi b WHERE " +
            "(LOWER(b.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(b.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND b.isActive = true")
    List<BCHDoanHoi> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT b FROM BCHDoanHoi b WHERE " +
            "(:keyword IS NULL OR LOWER(b.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(b.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:chucVu IS NULL OR b.chucVu = :chucVu) " +
            "AND (:maKhoa IS NULL OR b.khoa.maKhoa = :maKhoa) " +
            "AND b.isActive = true")
    List<BCHDoanHoi> searchAdvanced(
            @Param("keyword") String keyword,
            @Param("chucVu") String chucVu,
            @Param("maKhoa") String maKhoa
    );

    // ========== STATISTICS ==========

    @Query("SELECT b.chucVu, COUNT(b) FROM BCHDoanHoi b " +
            "WHERE b.isActive = true GROUP BY b.chucVu")
    List<Object[]> countByChucVu();

    @Query("SELECT b.khoa.maKhoa, b.khoa.tenKhoa, COUNT(b) FROM BCHDoanHoi b " +
            "WHERE b.isActive = true GROUP BY b.khoa.maKhoa, b.khoa.tenKhoa")
    List<Object[]> countByKhoa();
}