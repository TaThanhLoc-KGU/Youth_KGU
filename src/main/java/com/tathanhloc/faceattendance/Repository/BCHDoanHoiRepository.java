package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Enum.LoaiThanhVienEnum;
import com.tathanhloc.faceattendance.Model.BCHDoanHoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BCHDoanHoiRepository extends JpaRepository<BCHDoanHoi, String> {

    List<BCHDoanHoi> findByIsActiveTrueOrderByMaBchDesc();

    // Kiểm tra đã là BCH chưa
    boolean existsBySinhVienMaSvAndIsActiveTrue(String maSv);
    boolean existsByGiangVienMaGvAndIsActiveTrue(String maGv);
    boolean existsByChuyenVienMaChuyenVienAndIsActiveTrue(String maChuyenVien);

    // Tìm BCH theo thành viên
    Optional<BCHDoanHoi> findBySinhVienMaSvAndIsActiveTrue(String maSv);
    Optional<BCHDoanHoi> findByGiangVienMaGvAndIsActiveTrue(String maGv);
    Optional<BCHDoanHoi> findByChuyenVienMaChuyenVienAndIsActiveTrue(String maChuyenVien);

    @Query("SELECT COUNT(b) FROM BCHDoanHoi b WHERE b.isActive = true")
    long countActive();

    // Tìm mã BCH lớn nhất để gen mã mới
    @Query("SELECT b FROM BCHDoanHoi b WHERE b.maBch LIKE 'BCHKGU%' " +
            "ORDER BY b.maBch DESC")
    List<BCHDoanHoi> findLatestBCHCode();

    // Tìm kiếm BCH
    @Query("SELECT b FROM BCHDoanHoi b WHERE b.isActive = true " +
            "AND (LOWER(b.maBch) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR (b.sinhVien IS NOT NULL AND LOWER(b.sinhVien.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "OR (b.giangVien IS NOT NULL AND LOWER(b.giangVien.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "OR (b.chuyenVien IS NOT NULL AND LOWER(b.chuyenVien.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')))) " +
            "ORDER BY b.maBch DESC")
    List<BCHDoanHoi> searchByKeyword(@Param("keyword") String keyword);

    // Tìm BCH theo loại thành viên
    List<BCHDoanHoi> findByLoaiThanhVienAndIsActiveTrueOrderByMaBchDesc(LoaiThanhVienEnum loaiThanhVien);

    // Tìm BCH theo nhiệm kỳ
    List<BCHDoanHoi> findByNhiemKyAndIsActiveTrueOrderByMaBchDesc(String nhiemKy);

    // Thống kê theo loại thành viên
    @Query("SELECT b.loaiThanhVien, COUNT(b) FROM BCHDoanHoi b " +
            "WHERE b.isActive = true GROUP BY b.loaiThanhVien")
    List<Object[]> countByLoaiThanhVien();

    // Thống kê theo nhiệm kỳ
    @Query("SELECT b.nhiemKy, COUNT(b) FROM BCHDoanHoi b " +
            "WHERE b.isActive = true " +
            "GROUP BY b.nhiemKy " +
            "ORDER BY b.nhiemKy DESC")
    List<Object[]> countByNhiemKy();
}