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

/**
 * Repository cho Điểm danh hoạt động
 * ĐIỂM DANH BẰNG CÁCH QUÉT MÃ QR
 */
@Repository
public interface DiemDanhHoatDongRepository extends JpaRepository<DiemDanhHoatDong, Long> {

    // ========== BASIC QUERIES ==========

    /**
     * Tìm điểm danh theo hoạt động
     */
    List<DiemDanhHoatDong> findByHoatDongMaHoatDong(String maHoatDong);

    /**
     * Tìm điểm danh theo sinh viên
     */
    List<DiemDanhHoatDong> findBySinhVienMaSv(String maSv);

    /**
     * Tìm điểm danh theo trạng thái
     */
    List<DiemDanhHoatDong> findByTrangThai(TrangThaiThamGiaEnum trangThai);

    /**
     * Kiểm tra sinh viên đã điểm danh hoạt động chưa
     */
    boolean existsByHoatDongMaHoatDongAndSinhVienMaSv(String maHoatDong, String maSv);

    /**
     * Tìm điểm danh của sinh viên trong hoạt động
     */
    Optional<DiemDanhHoatDong> findByHoatDongMaHoatDongAndSinhVienMaSv(String maHoatDong, String maSv);

    // ========== QR CODE VALIDATION - QUAN TRỌNG ==========

    /**
     * Kiểm tra mã QR đã được quét chưa
     * (Tránh quét trùng)
     */
    boolean existsByMaQRDaQuet(String maQR);

    /**
     * Tìm điểm danh theo mã QR đã quét
     */
    Optional<DiemDanhHoatDong> findByMaQRDaQuet(String maQR);

    /**
     * Kiểm tra mã QR đã được sử dụng trong hoạt động cụ thể chưa
     */
    @Query("SELECT CASE WHEN COUNT(dd) > 0 THEN true ELSE false END " +
            "FROM DiemDanhHoatDong dd WHERE dd.maQRDaQuet = :maQR " +
            "AND dd.hoatDong.maHoatDong = :maHoatDong")
    boolean isQRAlreadyUsed(@Param("maQR") String maQR, @Param("maHoatDong") String maHoatDong);

    // ========== ATTENDANCE TRACKING ==========

    /**
     * Đếm số người đã tham gia hoạt động
     */
    long countByHoatDongMaHoatDongAndTrangThai(String maHoatDong, TrangThaiThamGiaEnum trangThai);

    /**
     * Lấy danh sách đã check-in
     */
    @Query("SELECT dd FROM DiemDanhHoatDong dd WHERE dd.hoatDong.maHoatDong = :maHoatDong " +
            "AND dd.trangThai = 'DA_THAM_GIA' ORDER BY dd.thoiGianCheckIn DESC")
    List<DiemDanhHoatDong> findCheckedInStudents(@Param("maHoatDong") String maHoatDong);

    /**
     * Lấy danh sách chưa check-in (đã đăng ký nhưng chưa điểm danh)
     */
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

    /**
     * Đếm số sinh viên chưa check-in
     */
    @Query("SELECT COUNT(dk) FROM DangKyHoatDong dk " +
            "WHERE dk.hoatDong.maHoatDong = :maHoatDong " +
            "AND dk.isActive = true " +
            "AND NOT EXISTS (" +
            "  SELECT 1 FROM DiemDanhHoatDong dd " +
            "  WHERE dd.hoatDong.maHoatDong = :maHoatDong " +
            "  AND dd.sinhVien.maSv = dk.sinhVien.maSv" +
            ")")
    long countNotCheckedIn(@Param("maHoatDong") String maHoatDong);

    // ========== TIME-BASED QUERIES ==========

    /**
     * Tìm điểm danh trong khoảng thời gian
     */
    List<DiemDanhHoatDong> findByThoiGianCheckInBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Tìm điểm danh của sinh viên trong tháng
     */
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

    // ========== VERIFIER QUERIES ==========

    /**
     * Tìm điểm danh do BCH cụ thể xác nhận
     */
    List<DiemDanhHoatDong> findByNguoiXacNhanMaBch(String maBch);

    /**
     * Đếm số lượt điểm danh BCH đã xác nhận
     */
    long countByNguoiXacNhanMaBch(String maBch);

    // ========== STATISTICS ==========

    /**
     * Thống kê điểm danh theo hoạt động
     */
    @Query("SELECT hd.maHoatDong, hd.tenHoatDong, " +
            "COUNT(CASE WHEN dd.trangThai = 'DA_THAM_GIA' THEN 1 END) as soNguoiThamGia, " +
            "COUNT(CASE WHEN dd.trangThai = 'VANG_MAT' THEN 1 END) as soNguoiVang " +
            "FROM DiemDanhHoatDong dd " +
            "JOIN dd.hoatDong hd " +
            "GROUP BY hd.maHoatDong, hd.tenHoatDong")
    List<Object[]> getAttendanceStatisticsByActivity();

    /**
     * Thống kê tham gia của sinh viên
     */
    @Query("SELECT sv.maSv, sv.hoTen, sv.lop.tenLop, " +
            "COUNT(CASE WHEN dd.trangThai = 'DA_THAM_GIA' THEN 1 END) as soHoatDongThamGia, " +
            "SUM(CASE WHEN dd.trangThai = 'DA_THAM_GIA' THEN hd.diemRenLuyen ELSE 0 END) as tongDiemRenLuyen " +
            "FROM DiemDanhHoatDong dd " +
            "JOIN dd.sinhVien sv " +
            "JOIN dd.hoatDong hd " +
            "GROUP BY sv.maSv, sv.hoTen, sv.lop.tenLop " +
            "ORDER BY soHoatDongThamGia DESC")
    List<Object[]> getStudentParticipationStatistics();

    /**
     * Tỷ lệ tham gia hoạt động
     */
    @Query("SELECT hd.maHoatDong, hd.tenHoatDong, " +
            "COUNT(dk) as tongDangKy, " +
            "COUNT(dd) as daThamGia, " +
            "CAST(COUNT(dd) * 100.0 / COUNT(dk) AS double) as tyLeThamGia " +
            "FROM HoatDong hd " +
            "LEFT JOIN DangKyHoatDong dk ON hd.maHoatDong = dk.hoatDong.maHoatDong AND dk.isActive = true " +
            "LEFT JOIN DiemDanhHoatDong dd ON hd.maHoatDong = dd.hoatDong.maHoatDong AND dd.trangThai = 'DA_THAM_GIA' " +
            "GROUP BY hd.maHoatDong, hd.tenHoatDong")
    List<Object[]> getParticipationRateByActivity();
}