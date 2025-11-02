package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Enum.*;
import com.tathanhloc.faceattendance.Model.HoatDong;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HoatDongRepository extends JpaRepository<HoatDong, String> {

    List<HoatDong> findByTrangThai(TrangThaiHoatDongEnum trangThai);
    List<HoatDong> findByTrangThaiAndIsActive(TrangThaiHoatDongEnum trangThai, Boolean isActive);
    List<HoatDong> findByIsActiveTrue();
    Page<HoatDong> findByIsActive(Boolean isActive, Pageable pageable);

    List<HoatDong> findByLoaiHoatDong(LoaiHoatDongEnum loaiHoatDong);
    List<HoatDong> findByLoaiHoatDongAndTrangThai(LoaiHoatDongEnum loaiHoatDong, TrangThaiHoatDongEnum trangThai);
    List<HoatDong> findByCapDo(CapDoEnum capDo);
    List<HoatDong> findByCapDoAndTrangThai(CapDoEnum capDo, TrangThaiHoatDongEnum trangThai);

    List<HoatDong> findByNguoiPhuTrachMaBch(String maBch);
    List<HoatDong> findByKhoaMaKhoa(String maKhoa);
    List<HoatDong> findByNganhMaNganh(String maNganh);

    @Query("SELECT hd FROM HoatDong hd WHERE " +
            "(LOWER(hd.tenHoatDong) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(hd.moTa) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND hd.isActive = true")
    List<HoatDong> searchByKeyword(@Param("keyword") String keyword);

    // THÊM METHODS NÀY
    @Query("SELECT hd FROM HoatDong hd WHERE hd.ngayToChuc > :currentDate " +
            "AND hd.isActive = true ORDER BY hd.ngayToChuc ASC")
    List<HoatDong> findUpcomingActivities(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT hd FROM HoatDong hd WHERE hd.ngayToChuc = :currentDate " +
            "AND hd.isActive = true ORDER BY hd.gioToChuc ASC")
    List<HoatDong> findOngoingActivities(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT hd FROM HoatDong hd WHERE hd.ngayToChuc BETWEEN :startDate AND :endDate " +
            "AND hd.isActive = true ORDER BY hd.ngayToChuc ASC")
    List<HoatDong> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT hd.trangThai, COUNT(hd) FROM HoatDong hd " +
            "WHERE hd.isActive = true GROUP BY hd.trangThai")
    List<Object[]> countByTrangThai();
}