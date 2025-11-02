package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Enum.TrangThaiThamGiaEnum;
import com.tathanhloc.faceattendance.Model.DiemDanhHoatDong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiemDanhHoatDongRepository extends JpaRepository<DiemDanhHoatDong, Long> {

    // Basic queries
    List<DiemDanhHoatDong> findByHoatDongMaHoatDong(String maHoatDong);
    List<DiemDanhHoatDong> findBySinhVienMaSv(String maSv);

    Optional<DiemDanhHoatDong> findByMaQRDaQuet(String maQR);

    @Query("SELECT CASE WHEN COUNT(dd) > 0 THEN true ELSE false END " +
            "FROM DiemDanhHoatDong dd WHERE dd.maQRDaQuet = :maQR " +
            "AND dd.hoatDong.maHoatDong = :maHoatDong")
    boolean isQRAlreadyUsed(@Param("maQR") String maQR, @Param("maHoatDong") String maHoatDong);

    long countByHoatDongMaHoatDongAndTrangThai(String maHoatDong, TrangThaiThamGiaEnum trangThai);

    // THÊM METHOD NÀY
    long countByHoatDongMaHoatDong(String maHoatDong);

    @Query("SELECT dd FROM DiemDanhHoatDong dd WHERE dd.hoatDong.maHoatDong = :maHoatDong " +
            "AND dd.trangThai = 'DA_THAM_GIA' ORDER BY dd.thoiGianCheckIn DESC")
    List<DiemDanhHoatDong> findCheckedInStudents(@Param("maHoatDong") String maHoatDong);

    @Query("SELECT sv.maSv, sv.hoTen, dk.maQR, dk.ngayDangKy " +
            "FROM DangKyHoatDong dk " +
            "JOIN dk.sinhVien sv " +
            "WHERE dk.hoatDong.maHoatDong = :maHoatDong " +
            "AND dk.isActive = true " +
            "AND NOT EXISTS (" +
            "  SELECT 1 FROM DiemDanhHoatDong dd " +
            "  WHERE dd.hoatDong.maHoatDong = :maHoatDong " +
            "  AND dd.sinhVien.maSv = sv.maSv" +
            ") " +
            "ORDER BY dk.ngayDangKy")
    List<Object[]> findNotCheckedInStudents(@Param("maHoatDong") String maHoatDong);

    @Query("SELECT COUNT(dk) FROM DangKyHoatDong dk " +
            "WHERE dk.hoatDong.maHoatDong = :maHoatDong " +
            "AND dk.isActive = true " +
            "AND NOT EXISTS (" +
            "  SELECT 1 FROM DiemDanhHoatDong dd " +
            "  WHERE dd.hoatDong.maHoatDong = :maHoatDong " +
            "  AND dd.sinhVien.maSv = dk.sinhVien.maSv" +
            ")")
    long countNotCheckedIn(@Param("maHoatDong") String maHoatDong);

    List<DiemDanhHoatDong> findByThoiGianCheckInBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT dd FROM DiemDanhHoatDong dd " +
            "WHERE dd.sinhVien.maSv = :maSv " +
            "AND YEAR(dd.thoiGianCheckIn) = :year " +
            "AND MONTH(dd.thoiGianCheckIn) = :month " +
            "ORDER BY dd.thoiGianCheckIn DESC")
    List<DiemDanhHoatDong> findByStudentAndMonth(
            @Param("maSv") String maSv,
            @Param("year") int year,
            @Param("month") int month
    );

    List<DiemDanhHoatDong> findByNguoiCheckInMaBch(String maBch);
    long countByNguoiCheckInMaBch(String maBch);

    // THÊM METHODS NÀY
    @Query("SELECT dd FROM DiemDanhHoatDong dd " +
            "WHERE dd.sinhVien.maSv = :maSv " +
            "AND dd.hoatDong.maHoatDong = :maHoatDong")
    Optional<DiemDanhHoatDong> findBySinhVienMaSvAndHoatDongMaHoatDong(
            @Param("maSv") String maSv,
            @Param("maHoatDong") String maHoatDong
    );

    @Query("SELECT CASE WHEN COUNT(dd) > 0 THEN true ELSE false END " +
            "FROM DiemDanhHoatDong dd " +
            "WHERE dd.sinhVien.maSv = :maSv " +
            "AND dd.hoatDong.maHoatDong = :maHoatDong")
    boolean existsBySinhVienMaSvAndHoatDongMaHoatDong(
            @Param("maSv") String maSv,
            @Param("maHoatDong") String maHoatDong
    );

    @Query("SELECT dd FROM DiemDanhHoatDong dd " +
            "WHERE dd.hoatDong.maHoatDong = :maHoatDong " +
            "AND dd.trangThai = :trangThai")
    List<DiemDanhHoatDong> findByHoatDongMaHoatDongAndTrangThai(
            @Param("maHoatDong") String maHoatDong,
            @Param("trangThai") TrangThaiThamGiaEnum trangThai
    );
}