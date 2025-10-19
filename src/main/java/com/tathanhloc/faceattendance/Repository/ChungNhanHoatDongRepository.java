package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.ChungNhanHoatDong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository cho Chứng nhận hoạt động
 */
@Repository
public interface ChungNhanHoatDongRepository extends JpaRepository<ChungNhanHoatDong, Long> {

    // ========== BASIC QUERIES ==========

    /**
     * Tìm theo mã chứng nhận
     */
    Optional<ChungNhanHoatDong> findByMaChungNhan(String maChungNhan);

    /**
     * Kiểm tra mã chứng nhận đã tồn tại chưa
     */
    boolean existsByMaChungNhan(String maChungNhan);

    /**
     * Tìm chứng nhận của sinh viên
     */
    List<ChungNhanHoatDong> findBySinhVienMaSv(String maSv);

    /**
     * Tìm chứng nhận của sinh viên (active)
     */
    List<ChungNhanHoatDong> findBySinhVienMaSvAndIsActiveTrue(String maSv);

    /**
     * Tìm chứng nhận theo hoạt động
     */
    List<ChungNhanHoatDong> findByHoatDongMaHoatDong(String maHoatDong);

    /**
     * Kiểm tra sinh viên đã có chứng nhận cho hoạt động chưa
     */
    boolean existsBySinhVienMaSvAndHoatDongMaHoatDong(String maSv, String maHoatDong);

    /**
     * Tìm chứng nhận cụ thể của sinh viên trong hoạt động
     */
    Optional<ChungNhanHoatDong> findBySinhVienMaSvAndHoatDongMaHoatDong(String maSv, String maHoatDong);

    // ========== DATE-BASED QUERIES ==========

    /**
     * Tìm chứng nhận được cấp trong tháng
     */
    @Query("SELECT cn FROM ChungNhanHoatDong cn " +
            "WHERE YEAR(cn.ngayCap) = :year AND MONTH(cn.ngayCap) = :month " +
            "AND cn.isActive = true " +
            "ORDER BY cn.ngayCap DESC")
    List<ChungNhanHoatDong> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    /**
     * Tìm chứng nhận trong khoảng thời gian
     */
    List<ChungNhanHoatDong> findByNgayCapBetween(LocalDate startDate, LocalDate endDate);

    // ========== SIGNER QUERIES ==========

    /**
     * Tìm chứng nhận do BCH ký
     */
    List<ChungNhanHoatDong> findByNguoiKyMaBch(String maBch);

    /**
     * Đếm số chứng nhận BCH đã ký
     */
    long countByNguoiKyMaBch(String maBch);

    // ========== STATISTICS ==========

    /**
     * Đếm số chứng nhận theo hoạt động
     */
    long countByHoatDongMaHoatDong(String maHoatDong);

    /**
     * Đếm số chứng nhận của sinh viên
     */
    long countBySinhVienMaSvAndIsActiveTrue(String maSv);

    /**
     * Thống kê chứng nhận theo hoạt động
     */
    @Query("SELECT hd.maHoatDong, hd.tenHoatDong, COUNT(cn) " +
            "FROM ChungNhanHoatDong cn " +
            "JOIN cn.hoatDong hd " +
            "WHERE cn.isActive = true " +
            "GROUP BY hd.maHoatDong, hd.tenHoatDong " +
            "ORDER BY COUNT(cn) DESC")
    List<Object[]> countCertificatesByActivity();
}
