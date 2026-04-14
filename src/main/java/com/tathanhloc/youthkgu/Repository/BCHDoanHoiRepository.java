package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.LoaiThanhVienEnum;
import com.tathanhloc.youthkgu.Model.BCHDoanHoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BCHDoanHoiRepository extends JpaRepository<BCHDoanHoi, String> {

    List<BCHDoanHoi> findByIsActiveTrueOrderByMaBchDesc();

    // Kiểm tra đã là BCH chưa
    boolean existsBySinhVienMaSvAndIsActiveTrue(String maSv);
    boolean existsByGiangVienMaGvAndIsActiveTrue(String maGv);
    boolean existsByChuyenVienMaChuyenVienAndIsActiveTrue(String maChuyenVien);

    // Tìm BCH theo thành viên (trả về List để hỗ trợ nhiều nhiệm kỳ active)
    List<BCHDoanHoi> findBySinhVienMaSvAndIsActiveTrue(String maSv);
    List<BCHDoanHoi> findByGiangVienMaGvAndIsActiveTrue(String maGv);
    List<BCHDoanHoi> findByChuyenVienMaChuyenVienAndIsActiveTrue(String maChuyenVien);

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

    // Lọc BCH theo khoa:
    //   - Sinh viên: qua sinhVien.lop.nganh.khoa
    //   - Giảng viên: qua giangVien.khoa (trực tiếp)
    //   - Chuyên viên: không gắn khoa → không lọc (luôn hiện)
    @Query("SELECT b FROM BCHDoanHoi b WHERE b.isActive = true AND (" +
            "(b.sinhVien IS NOT NULL AND b.sinhVien.lop.nganh.khoa.maKhoa = :maKhoa) OR " +
            "(b.giangVien IS NOT NULL AND b.giangVien.khoa.maKhoa = :maKhoa)" +
            ") ORDER BY b.maBch DESC")
    List<BCHDoanHoi> findByKhoaMaKhoa(@Param("maKhoa") String maKhoa);

    @Query("SELECT b FROM BCHDoanHoi b WHERE b.isActive = true AND (" +
            "(b.sinhVien IS NOT NULL AND b.sinhVien.lop.nganh.khoa.maKhoa = :maKhoa) OR " +
            "(b.giangVien IS NOT NULL AND b.giangVien.khoa.maKhoa = :maKhoa)" +
            ") AND (LOWER(b.maBch) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR (b.sinhVien IS NOT NULL AND LOWER(b.sinhVien.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "OR (b.giangVien IS NOT NULL AND LOWER(b.giangVien.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')))) " +
            "ORDER BY b.maBch DESC")
    List<BCHDoanHoi> searchByKeywordAndKhoa(@Param("keyword") String keyword, @Param("maKhoa") String maKhoa);
}