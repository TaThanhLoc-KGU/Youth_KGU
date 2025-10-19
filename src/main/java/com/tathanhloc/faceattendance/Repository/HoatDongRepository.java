package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Enum.CapDoEnum;
import com.tathanhloc.faceattendance.Enum.LoaiHoatDongEnum;
import com.tathanhloc.faceattendance.Enum.TrangThaiHoatDongEnum;
import com.tathanhloc.faceattendance.Model.HoatDong;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HoatDongRepository extends JpaRepository<HoatDong, String> {

    // ========== BASIC QUERIES ==========

    List<HoatDong> findByTrangThai(TrangThaiHoatDongEnum trangThai);
    List<HoatDong> findByTrangThaiAndIsActive(TrangThaiHoatDongEnum trangThai, Boolean isActive);
    List<HoatDong> findByIsActiveTrue();
    Page<HoatDong> findByIsActive(Boolean isActive, Pageable pageable);

    // ========== FILTER BY CATEGORY ==========

    List<HoatDong> findByLoaiHoatDong(LoaiHoatDongEnum loaiHoatDong);
    List<HoatDong> findByLoaiHoatDongAndTrangThai(LoaiHoatDongEnum loaiHoatDong, TrangThaiHoatDongEnum trangThai);
    List<HoatDong> findByCapDo(CapDoEnum capDo);
    List<HoatDong> findByCapDoAndTrangThai(CapDoEnum capDo, TrangThaiHoatDongEnum trangThai);

    // ========== FILTER BY ORGANIZER ==========

    List<HoatDong> findByNguoiPhuTrachMaBch(String maBch);
    List<HoatDong> findByKhoaMaKhoa(String maKhoa);
    List<HoatDong> findByNganhMaNganh(String maNganh);
    List<HoatDong> findByPhongHocMaPhong(String maPhong);

    // ========== FILTER BY DATE ==========

    List<HoatDong> findByNgayToChuc(LocalDate ngayToChuc);
    List<HoatDong> findByNgayToChucBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT h FROM HoatDong h WHERE " +
            "YEAR(h.ngayToChuc) = :year AND MONTH(h.ngayToChuc) = :month " +
            "AND h.isActive = true " +
            "ORDER BY h.ngayToChuc, h.thoiGianBatDau")
    List<HoatDong> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    @Query("SELECT h FROM HoatDong h WHERE h.ngayToChuc = :today AND h.isActive = true " +
            "ORDER BY h.thoiGianBatDau")
    List<HoatDong> findToday(@Param("today") LocalDate today);

    @Query("SELECT h FROM HoatDong h WHERE h.ngayToChuc BETWEEN :startOfWeek AND :endOfWeek " +
            "AND h.isActive = true ORDER BY h.ngayToChuc, h.thoiGianBatDau")
    List<HoatDong> findThisWeek(@Param("startOfWeek") LocalDate startOfWeek, @Param("endOfWeek") LocalDate endOfWeek);

    @Query("SELECT h FROM HoatDong h WHERE h.ngayToChuc >= :today " +
            "AND h.trangThai = 'SAP_DIEN_RA' AND h.isActive = true " +
            "ORDER BY h.ngayToChuc, h.thoiGianBatDau")
    List<HoatDong> findUpcoming(@Param("today") LocalDate today);

    // ========== REGISTRATION QUERIES ==========

    @Query("SELECT h FROM HoatDong h WHERE h.choPhepDangKy = true " +
            "AND h.hanDangKy > :now AND h.trangThai = 'SAP_DIEN_RA' " +
            "AND h.isActive = true ORDER BY h.ngayToChuc")
    List<HoatDong> findOpenForRegistration(@Param("now") LocalDateTime now);

    @Query("SELECT CASE WHEN h.soLuongToiDa IS NULL THEN true " +
            "WHEN h.soLuongToiDa > (SELECT COUNT(dk) FROM DangKyHoatDong dk " +
            "WHERE dk.hoatDong.maHoatDong = :maHoatDong AND dk.isActive = true) " +
            "THEN true ELSE false END " +
            "FROM HoatDong h WHERE h.maHoatDong = :maHoatDong")
    Boolean hasAvailableSlots(@Param("maHoatDong") String maHoatDong);

    // ========== SEARCH & FILTER ==========

    @Query("SELECT h FROM HoatDong h WHERE " +
            "(LOWER(h.tenHoatDong) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(h.moTa) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND h.isActive = true")
    List<HoatDong> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT h FROM HoatDong h WHERE " +
            "(:keyword IS NULL OR LOWER(h.tenHoatDong) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:loaiHoatDong IS NULL OR h.loaiHoatDong = :loaiHoatDong) " +
            "AND (:trangThai IS NULL OR h.trangThai = :trangThai) " +
            "AND (:capDo IS NULL OR h.capDo = :capDo) " +
            "AND h.isActive = true")
    List<HoatDong> searchAdvanced(
            @Param("keyword") String keyword,
            @Param("loaiHoatDong") LoaiHoatDongEnum loaiHoatDong,
            @Param("trangThai") TrangThaiHoatDongEnum trangThai,
            @Param("capDo") CapDoEnum capDo
    );

    // ========== STATISTICS ==========

    @Query("SELECT h.loaiHoatDong, COUNT(h) FROM HoatDong h " +
            "WHERE h.isActive = true GROUP BY h.loaiHoatDong")
    List<Object[]> countByLoaiHoatDong();

    @Query("SELECT h.trangThai, COUNT(h) FROM HoatDong h " +
            "WHERE h.isActive = true GROUP BY h.trangThai")
    List<Object[]> countByTrangThai();
}
