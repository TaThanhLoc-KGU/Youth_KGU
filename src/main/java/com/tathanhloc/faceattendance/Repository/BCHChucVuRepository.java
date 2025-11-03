package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.BCHChucVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BCHChucVuRepository extends JpaRepository<BCHChucVu, Long> {

    // Lấy tất cả chức vụ của 1 BCH
    List<BCHChucVu> findByBchMaBchAndIsActiveTrue(String maBch);

    // Lấy tất cả BCH có chức vụ X
    List<BCHChucVu> findByChucVuMaChucVuAndIsActiveTrue(String maChucVu);

    // Lấy tất cả BCH trong ban X
    List<BCHChucVu> findByBanMaBanAndIsActiveTrue(String maBan);

    // Lấy tất cả chức vụ của 1 BCH
    List<BCHChucVu> findByBchMaBchAndIsActiveTrueOrderByIdAsc(String maBch);

    // Lấy tất cả BCH có chức vụ X
    List<BCHChucVu> findByChucVuMaChucVuAndIsActiveTrueOrderByBchMaBchAsc(String maChucVu);

    // Lấy tất cả BCH trong ban X
    List<BCHChucVu> findByBanMaBanAndIsActiveTrueOrderByBchMaBchAsc(String maBan);

    // Kiểm tra BCH đã có chức vụ này chưa
    @Query("SELECT CASE WHEN COUNT(bcv) > 0 THEN true ELSE false END " +
            "FROM BCHChucVu bcv WHERE bcv.bch.maBch = :maBch " +
            "AND bcv.chucVu.maChucVu = :maChucVu " +
            "AND bcv.isActive = true")
    boolean existsByBchAndChucVu(@Param("maBch") String maBch,
                                 @Param("maChucVu") String maChucVu);

    // Đếm số BCH theo chức vụ
    @Query("SELECT bcv.chucVu.tenChucVu, COUNT(DISTINCT bcv.bch.maBch) " +
            "FROM BCHChucVu bcv WHERE bcv.isActive = true " +
            "GROUP BY bcv.chucVu.tenChucVu")
    List<Object[]> countBCHByChucVu();

    // Đếm số BCH theo ban
    @Query("SELECT bcv.ban.tenBan, COUNT(DISTINCT bcv.bch.maBch) " +
            "FROM BCHChucVu bcv WHERE bcv.isActive = true AND bcv.ban IS NOT NULL " +
            "GROUP BY bcv.ban.tenBan")
    List<Object[]> countBCHByBan();
}