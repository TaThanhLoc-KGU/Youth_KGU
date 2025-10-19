package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.DangKyHoatDong;
import com.tathanhloc.faceattendance.Model.DangKyHoatDongId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho Đăng ký hoạt động
 * QUAN TRỌNG: Mỗi đăng ký có 1 mã QR duy nhất
 */
@Repository
public interface DangKyHoatDongRepository extends JpaRepository<DangKyHoatDong, DangKyHoatDongId> {

    // ========== BASIC QUERIES ==========

    /**
     * Tìm đăng ký theo sinh viên
     */
    List<DangKyHoatDong> findBySinhVienMaSv(String maSv);

    /**
     * Tìm đăng ký theo hoạt động
     */
    List<DangKyHoatDong> findByHoatDongMaHoatDong(String maHoatDong);

    /**
     * Tìm đăng ký active theo sinh viên
     */
    List<DangKyHoatDong> findBySinhVienMaSvAndIsActiveTrue(String maSv);

    /**
     * Tìm đăng ký active theo hoạt động
     */
    List<DangKyHoatDong> findByHoatDongMaHoatDongAndIsActiveTrue(String maHoatDong);

    /**
     * Kiểm tra sinh viên đã đăng ký hoạt động chưa
     */
    boolean existsByIdMaSvAndIdMaHoatDongAndIsActiveTrue(String maSv, String maHoatDong);

    /**
     * Đếm số người đăng ký hoạt động
     */
    long countByHoatDongMaHoatDongAndIsActiveTrue(String maHoatDong);

    // ========== QR CODE QUERIES - QUAN TRỌNG ==========

    /**
     * Tìm đăng ký theo mã QR
     * DÙNG ĐỂ VALIDATE KHI QUÉT QR CODE
     */
    Optional<DangKyHoatDong> findByMaQR(String maQR);

    /**
     * Tìm đăng ký active theo mã QR
     */
    Optional<DangKyHoatDong> findByMaQRAndIsActiveTrue(String maQR);

    /**
     * Kiểm tra mã QR có tồn tại không
     */
    boolean existsByMaQR(String maQR);

    /**
     * Validate mã QR có thuộc hoạt động cụ thể không
     */
    @Query("SELECT CASE WHEN COUNT(dk) > 0 THEN true ELSE false END " +
            "FROM DangKyHoatDong dk WHERE dk.maQR = :maQR " +
            "AND dk.hoatDong.maHoatDong = :maHoatDong AND dk.isActive = true")
    boolean isValidQRForActivity(@Param("maQR") String maQR, @Param("maHoatDong") String maHoatDong);

    /**
     * Lấy thông tin đầy đủ từ mã QR
     */
    @Query("SELECT dk FROM DangKyHoatDong dk " +
            "JOIN FETCH dk.sinhVien " +
            "JOIN FETCH dk.hoatDong " +
            "WHERE dk.maQR = :maQR AND dk.isActive = true")
    Optional<DangKyHoatDong> findByMaQRWithDetails(@Param("maQR") String maQR);

    // ========== CONFIRMATION QUERIES ==========

    /**
     * Tìm đăng ký chưa xác nhận
     */
    List<DangKyHoatDong> findByHoatDongMaHoatDongAndDaXacNhanFalseAndIsActiveTrue(String maHoatDong);

    /**
     * Tìm đăng ký đã xác nhận
     */
    List<DangKyHoatDong> findByHoatDongMaHoatDongAndDaXacNhanTrueAndIsActiveTrue(String maHoatDong);

    /**
     * Đếm số đăng ký chưa xác nhận
     */
    long countByHoatDongMaHoatDongAndDaXacNhanFalseAndIsActiveTrue(String maHoatDong);

    // ========== SEARCH & FILTER ==========

    /**
     * Tìm đăng ký của sinh viên trong khoảng thời gian
     */
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

    /**
     * Tìm sinh viên chưa có mã QR (trong trường hợp lỗi)
     */
    @Query("SELECT dk FROM DangKyHoatDong dk WHERE dk.maQR IS NULL OR dk.maQR = ''")
    List<DangKyHoatDong> findWithoutQRCode();

    // ========== STATISTICS ==========

    /**
     * Thống kê số lượng đăng ký theo hoạt động
     */
    @Query("SELECT hd.maHoatDong, hd.tenHoatDong, COUNT(dk) " +
            "FROM DangKyHoatDong dk " +
            "JOIN dk.hoatDong hd " +
            "WHERE dk.isActive = true " +
            "GROUP BY hd.maHoatDong, hd.tenHoatDong " +
            "ORDER BY COUNT(dk) DESC")
    List<Object[]> countRegistrationsByActivity();

    /**
     * Top sinh viên tham gia nhiều hoạt động nhất
     */
    @Query("SELECT sv.maSv, sv.hoTen, COUNT(dk) " +
            "FROM DangKyHoatDong dk " +
            "JOIN dk.sinhVien sv " +
            "WHERE dk.isActive = true " +
            "GROUP BY sv.maSv, sv.hoTen " +
            "ORDER BY COUNT(dk) DESC")
    List<Object[]> findMostActiveStudents();
}