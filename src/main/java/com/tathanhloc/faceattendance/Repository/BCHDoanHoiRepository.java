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


    List<BCHDoanHoi> findByIsActiveTrue();
    Optional<BCHDoanHoi> findBySinhVienMaSv(String maSv);


    // ========== BASIC QUERIES ==========

    List<BCHDoanHoi> findByIsActive(Boolean isActive);

    // ========== SEARCH & FILTER ==========

    @Query("SELECT b FROM BCHDoanHoi b WHERE b.isActive = true " +
            "AND (LOWER(b.maBch) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(b.sinhVien.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(b.sinhVien.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<BCHDoanHoi> searchAdvanced(@Param("keyword") String keyword);


    List<BCHDoanHoi> findByIsActiveTrueOrderByMaBchDesc();

    Optional<BCHDoanHoi> findBySinhVienMaSvAndIsActiveTrue(String maSv);

    boolean existsBySinhVienMaSv(String maSv);

    @Query("SELECT COUNT(b) FROM BCHDoanHoi b WHERE b.isActive = true")
    long countActive();

    // Tìm mã BCH lớn nhất để gen mã mới
    @Query("SELECT b FROM BCHDoanHoi b WHERE b.maBch LIKE 'BCHKGU%' " +
            "ORDER BY b.maBch DESC")
    List<BCHDoanHoi> findLatestBCHCode();

    // Tìm kiếm BCH
    @Query("SELECT b FROM BCHDoanHoi b WHERE b.isActive = true " +
            "AND (LOWER(b.maBch) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(b.sinhVien.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(b.sinhVien.maSv) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY b.maBch DESC")
    List<BCHDoanHoi> searchByKeyword(@Param("keyword") String keyword);

    // Tìm BCH theo nhiệm kỳ
    List<BCHDoanHoi> findByNhiemKyAndIsActiveTrueOrderByMaBchDesc(String nhiemKy);
}