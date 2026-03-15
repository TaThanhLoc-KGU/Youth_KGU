package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DangKyHoatDong;
import com.tathanhloc.youthkgu.Model.DangKyHoatDongId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DangKyHoatDongRepository extends JpaRepository<DangKyHoatDong, DangKyHoatDongId> {

    List<DangKyHoatDong> findByHoatDongMaHoatDongAndIsActiveTrue(String maHoatDong);
    List<DangKyHoatDong> findBySinhVienMaSvAndIsActiveTrue(String maSv);

    // Include isActive=NULL rows (legacy data added before column existed)
    @Query("SELECT dk FROM DangKyHoatDong dk JOIN FETCH dk.sinhVien " +
            "WHERE dk.hoatDong.maHoatDong = :maHoatDong " +
            "AND (dk.isActive = true OR dk.isActive IS NULL)")
    List<DangKyHoatDong> findByHoatDongMaHoatDongAndIsActiveNotFalse(@Param("maHoatDong") String maHoatDong);

    long countByHoatDongMaHoatDongAndIsActiveTrue(String maHoatDong);

    Optional<DangKyHoatDong> findByMaQR(String maQR);
    Optional<DangKyHoatDong> findByMaQRAndIsActiveTrue(String maQR);
    boolean existsByMaQR(String maQR);

    @Query("SELECT CASE WHEN COUNT(dk) > 0 THEN true ELSE false END " +
            "FROM DangKyHoatDong dk WHERE dk.maQR = :maQR " +
            "AND dk.hoatDong.maHoatDong = :maHoatDong AND dk.isActive = true")
    boolean isValidQRForActivity(@Param("maQR") String maQR, @Param("maHoatDong") String maHoatDong);

    @Query("SELECT dk FROM DangKyHoatDong dk " +
            "JOIN FETCH dk.sinhVien " +
            "JOIN FETCH dk.hoatDong " +
            "WHERE dk.maQR = :maQR")
    Optional<DangKyHoatDong> findByMaQRWithDetails(@Param("maQR") String maQR);

    List<DangKyHoatDong> findByHoatDongMaHoatDongAndDaXacNhanFalseAndIsActiveTrue(String maHoatDong);
    List<DangKyHoatDong> findByHoatDongMaHoatDongAndDaXacNhanTrueAndIsActiveTrue(String maHoatDong);

    long countByHoatDongMaHoatDongAndDaXacNhanFalseAndIsActiveTrue(String maHoatDong);
    long countByHoatDongMaHoatDongAndDaXacNhanTrueAndIsActiveTrue(String maHoatDong);

    @Query("SELECT dk FROM DangKyHoatDong dk " +
            "WHERE dk.sinhVien.maSv = :maSv " +
            "AND dk.hoatDong.ngayToChuc BETWEEN :startDate AND :endDate " +
            "AND dk.isActive = true " +
            "ORDER BY dk.hoatDong.ngayToChuc DESC")
    List<DangKyHoatDong> findByStudentAndDateRange(
            @Param("maSv") String maSv,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate
    );

    /** Tổng số đăng ký active — 1 query thay vì N trong statistics overview */
    @Query("SELECT COUNT(dk) FROM DangKyHoatDong dk WHERE dk.isActive = true")
    long countAllActive();

    /** Map mã hoạt động → số đăng ký — dùng cho bulk load tránh N+1 trong getAll() */
    @Query("SELECT dk.hoatDong.maHoatDong, COUNT(dk) FROM DangKyHoatDong dk " +
            "WHERE dk.isActive = true GROUP BY dk.hoatDong.maHoatDong")
    List<Object[]> countGroupByHoatDong();

    @Query("SELECT dk.sinhVien.lop.maKhoa.maKhoa, dk.sinhVien.lop.maKhoa.tenKhoa, COUNT(dk) " +
            "FROM DangKyHoatDong dk " +
            "WHERE dk.hoatDong.maHoatDong = :maHoatDong AND dk.isActive = true " +
            "GROUP BY dk.sinhVien.lop.maKhoa.maKhoa, dk.sinhVien.lop.maKhoa.tenKhoa")
    List<Object[]> countByFaculty(@Param("maHoatDong") String maHoatDong);

    // ========== PERFORMANCE QUERIES (GROUP BY thay thế findAll) ==========

    /**
     * Đếm đăng ký theo khoa (toàn bộ) — native SQL thay thế findAll().forEach() trong getDashboardData.
     * Trả về: [ten_khoa (String), tongDangKy (Long)]
     */
    @Query(value = "SELECT COALESCE(k.ten_khoa, 'Không xác định') as ten_khoa, " +
            "COUNT(*) as tong_dang_ky " +
            "FROM dang_ky_hoat_dong dk " +
            "LEFT JOIN sinhvien sv ON dk.ma_sv = sv.ma_sv " +
            "LEFT JOIN lop l ON sv.ma_lop = l.ma_lop " +
            "LEFT JOIN khoa k ON l.ma_khoa = k.ma_khoa " +
            "WHERE dk.is_active = true " +
            "GROUP BY k.ma_khoa, k.ten_khoa",
            nativeQuery = true)
    List<Object[]> countDangKyGroupByKhoa();

    /**
     * Trend đăng ký 12 tháng — dùng cho getDashboardData.
     * Trả về: [nam (Integer), thang (Integer), tongDangKy (Long)]
     */
    @Query(value = "SELECT YEAR(hd.ngay_to_chuc) as nam, MONTH(hd.ngay_to_chuc) as thang, " +
            "COUNT(dk.ma_sv) as tong_dang_ky " +
            "FROM dang_ky_hoat_dong dk " +
            "JOIN hoat_dong hd ON dk.ma_hoat_dong = hd.ma_hoat_dong " +
            "WHERE hd.ngay_to_chuc >= :startDate AND dk.is_active = true " +
            "GROUP BY YEAR(hd.ngay_to_chuc), MONTH(hd.ngay_to_chuc) " +
            "ORDER BY nam, thang",
            nativeQuery = true)
    List<Object[]> findTrendDangKyLast12Months(@Param("startDate") java.time.LocalDate startDate);
}