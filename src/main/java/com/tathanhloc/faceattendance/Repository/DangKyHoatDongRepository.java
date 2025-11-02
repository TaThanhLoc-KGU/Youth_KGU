package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.DangKyHoatDong;
import com.tathanhloc.faceattendance.Model.DangKyHoatDongId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DangKyHoatDongRepository extends JpaRepository<DangKyHoatDong, DangKyHoatDongId> {

    List<DangKyHoatDong> findByHoatDongMaHoatDongAndIsActiveTrue(String maHoatDong);
    List<DangKyHoatDong> findBySinhVienMaSvAndIsActiveTrue(String maSv);

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
            "WHERE dk.maQR = :maQR AND dk.isActive = true")
    Optional<DangKyHoatDong> findByMaQRWithDetails(@Param("maQR") String maQR);

    List<DangKyHoatDong> findByHoatDongMaHoatDongAndDaXacNhanFalseAndIsActiveTrue(String maHoatDong);
    List<DangKyHoatDong> findByHoatDongMaHoatDongAndDaXacNhanTrueAndIsActiveTrue(String maHoatDong);

    long countByHoatDongMaHoatDongAndDaXacNhanFalseAndIsActiveTrue(String maHoatDong);

    // THÊM METHOD NÀY
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

    // Đếm đăng ký theo khoa
    @Query("SELECT COUNT(dk) FROM DangKyHoatDong dk " +
            "WHERE dk.sinhVien.lop.nganh.khoa.maKhoa = :maKhoa AND " +
            "(:maHoatDong IS NULL OR dk.id.maHoatDong = :maHoatDong) AND " +
            "(:fromDate IS NULL OR DATE(dk.ngayDangKy) >= :fromDate) AND " +
            "(:toDate IS NULL OR DATE(dk.ngayDangKy) <= :toDate) AND " +
            "dk.isActive = true")
    long countByKhoaAndDateRange(@Param("maKhoa") String maKhoa,
                                 @Param("maHoatDong") String maHoatDong,
                                 @Param("fromDate") LocalDate fromDate,
                                 @Param("toDate") LocalDate toDate);

    // Đếm theo thời gian đăng ký
    long countByNgayDangKyBetween(LocalDateTime start, LocalDateTime end);

    // Top sinh viên
    @Query("SELECT dk.id.maSv, COUNT(DISTINCT dk.id.maHoatDong), " +
            "COUNT(DISTINCT dd.id) " +
            "FROM DangKyHoatDong dk " +
            "LEFT JOIN DiemDanhHoatDong dd ON dd.sinhVien.maSv = dk.id.maSv " +
            "  AND dd.hoatDong.maHoatDong = dk.id.maHoatDong " +
            "  AND dd.trangThai = com.tathanhloc.faceattendance.Enum.TrangThaiThamGiaEnum.DA_THAM_GIA " +
            "WHERE (:maKhoa IS NULL OR dk.sinhVien.lop.nganh.khoa.maKhoa = :maKhoa) AND " +
            "(:fromDate IS NULL OR DATE(dk.ngayDangKy) >= :fromDate) AND " +
            "(:toDate IS NULL OR DATE(dk.ngayDangKy) <= :toDate) AND " +
            "dk.isActive = true " +
            "GROUP BY dk.id.maSv " +
            "ORDER BY COUNT(DISTINCT dd.id) DESC, " +
            "COUNT(DISTINCT dk.id.maHoatDong) DESC")
    List<Object[]> findTopStudentsByParticipation(@Param("limit") int limit,
                                                  @Param("maKhoa") String maKhoa,
                                                  @Param("fromDate") LocalDate fromDate,
                                                  @Param("toDate") LocalDate toDate);

    // Đếm đăng ký theo lớp
    @Query("SELECT COUNT(dk) FROM DangKyHoatDong dk " +
            "WHERE dk.sinhVien.lop.maLop = :maLop AND " +
            "(:maHoatDong IS NULL OR dk.id.maHoatDong = :maHoatDong) AND " +
            "(:fromDate IS NULL OR DATE(dk.ngayDangKy) >= :fromDate) AND " +
            "(:toDate IS NULL OR DATE(dk.ngayDangKy) <= :toDate) AND " +
            "dk.isActive = true")
    long countByLopAndDateRange(@Param("maLop") String maLop,
                                @Param("maHoatDong") String maHoatDong,
                                @Param("fromDate") LocalDate fromDate,
                                @Param("toDate") LocalDate toDate);
}
