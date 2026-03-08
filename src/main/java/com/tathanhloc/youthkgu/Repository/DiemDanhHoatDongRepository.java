package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.TrangThaiThamGiaEnum;
import com.tathanhloc.youthkgu.Model.DiemDanhHoatDong;
import org.springframework.data.domain.Pageable;
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

    // Find active session (not checked out) by QR
    Optional<DiemDanhHoatDong> findByMaQRDaQuetAndThoiGianCheckOutIsNull(String maQR);

    @Query("SELECT CASE WHEN COUNT(dd) > 0 THEN true ELSE false END " +
            "FROM DiemDanhHoatDong dd WHERE dd.maQRDaQuet = :maQR " +
            "AND dd.hoatDong.maHoatDong = :maHoatDong")
    boolean isQRAlreadyUsed(@Param("maQR") String maQR, @Param("maHoatDong") String maHoatDong);

    long countByHoatDongMaHoatDongAndTrangThai(String maHoatDong, TrangThaiThamGiaEnum trangThai);

    long countByHoatDongMaHoatDong(String maHoatDong);

    @Query("SELECT dd FROM DiemDanhHoatDong dd WHERE dd.hoatDong.maHoatDong = :maHoatDong " +
            "AND dd.trangThai = 'DA_THAM_GIA' ORDER BY dd.thoiGianCheckIn DESC")
    List<DiemDanhHoatDong> findCheckedInStudents(@Param("maHoatDong") String maHoatDong);

    @Query("SELECT sv.maSv, sv.hoTen, dk.maQR, dk.ngayDangKy, " +
            "CASE WHEN sv.lop IS NOT NULL THEN sv.lop.maLop ELSE NULL END, " +
            "CASE WHEN sv.lop IS NOT NULL AND sv.lop.maKhoa IS NOT NULL THEN sv.lop.maKhoa.tenKhoa ELSE NULL END " +
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

    // ========== DASHBOARD QUERIES ==========

    @Query("SELECT d.hoatDong.maHoatDong, d.hoatDong.tenHoatDong, d.hoatDong.ngayToChuc, COUNT(d) " +
            "FROM DiemDanhHoatDong d WHERE d.trangThai = 'DA_THAM_GIA' " +
            "GROUP BY d.hoatDong.maHoatDong, d.hoatDong.tenHoatDong, d.hoatDong.ngayToChuc " +
            "ORDER BY COUNT(d) DESC")
    List<Object[]> findTopActivitiesByAttendance(Pageable pageable);

    @Query("SELECT d.sinhVien.maSv, d.sinhVien.hoTen, COUNT(d) " +
            "FROM DiemDanhHoatDong d WHERE d.trangThai = 'DA_THAM_GIA' " +
            "GROUP BY d.sinhVien.maSv, d.sinhVien.hoTen " +
            "ORDER BY COUNT(d) DESC")
    List<Object[]> findTopStudentsByParticipation(Pageable pageable);

    @Query("SELECT COUNT(d) FROM DiemDanhHoatDong d WHERE d.trangThai = :trangThai")
    long countByTrangThai(@Param("trangThai") TrangThaiThamGiaEnum trangThai);

    /** Tổng số lượt điểm danh — 1 query thay vì N trong statistics overview */
    @Query("SELECT COUNT(dd) FROM DiemDanhHoatDong dd")
    long countAll();
}