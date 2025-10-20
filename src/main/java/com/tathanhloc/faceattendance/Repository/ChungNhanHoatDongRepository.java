package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.ChungNhanHoatDong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChungNhanHoatDongRepository extends JpaRepository<ChungNhanHoatDong, Long> {

    Optional<ChungNhanHoatDong> findByMaChungNhan(String maChungNhan);
    boolean existsByMaChungNhan(String maChungNhan);

    List<ChungNhanHoatDong> findBySinhVienMaSv(String maSv);
    List<ChungNhanHoatDong> findBySinhVienMaSvAndIsActiveTrue(String maSv);

    List<ChungNhanHoatDong> findByHoatDongMaHoatDong(String maHoatDong);

    boolean existsBySinhVienMaSvAndHoatDongMaHoatDong(String maSv, String maHoatDong);
    Optional<ChungNhanHoatDong> findBySinhVienMaSvAndHoatDongMaHoatDong(String maSv, String maHoatDong);

    @Query("SELECT cn FROM ChungNhanHoatDong cn " +
            "WHERE YEAR(cn.ngayCap) = :year AND MONTH(cn.ngayCap) = :month " +
            "AND cn.isActive = true " +
            "ORDER BY cn.ngayCap DESC")
    List<ChungNhanHoatDong> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    // THÊM METHODS NÀY
    @Query("SELECT cn FROM ChungNhanHoatDong cn " +
            "WHERE cn.ngayCap BETWEEN :startDate AND :endDate " +
            "AND cn.isActive = true " +
            "ORDER BY cn.ngayCap DESC")
    List<ChungNhanHoatDong> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT cn FROM ChungNhanHoatDong cn WHERE cn.isActive = true")
    List<ChungNhanHoatDong> findByIsActiveTrue();
}
