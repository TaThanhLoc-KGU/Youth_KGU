package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.DangKyHoatDong;
import com.tathanhloc.faceattendance.Model.DangKyHoatDongId;
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
}
