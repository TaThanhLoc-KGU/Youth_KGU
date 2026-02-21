package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.PhanCongDiemDanh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PhanCongDiemDanh entity
 * Quản lý các phân công điểm danh cho các hoạt động
 */
@Repository
public interface PhanCongDiemDanhRepository extends JpaRepository<PhanCongDiemDanh, Long> {

    /**
     * Lấy danh sách các người được phân công điểm danh cho một hoạt động
     * @param maHoatDong Mã hoạt động
     * @return List của PhanCongDiemDanh
     */
    @Query("SELECT p FROM PhanCongDiemDanh p WHERE p.hoatDong.maHoatDong = ?1 AND p.isActive = true")
    List<PhanCongDiemDanh> findByHoatDongMaHoatDongAndIsActiveTrue(String maHoatDong);

    /**
     * Lấy danh sách các hoạt động được phân công cho một BCH
     * @param maBch Mã BCH
     * @return List của PhanCongDiemDanh
     */
    @Query("SELECT p FROM PhanCongDiemDanh p WHERE p.bchPhuTrach.maBch = ?1 AND p.isActive = true")
    List<PhanCongDiemDanh> findByBchMaBchAndIsActiveTrue(String maBch);

    /**
     * Kiểm tra xem một BCH đã được phân công cho hoạt động hay chưa
     * @param maHoatDong Mã hoạt động
     * @param maBch Mã BCH
     * @return true nếu đã được phân công
     */
    @Query("SELECT COUNT(p) > 0 FROM PhanCongDiemDanh p WHERE p.hoatDong.maHoatDong = ?1 AND p.bchPhuTrach.maBch = ?2 AND p.isActive = true")
    boolean existsByHoatDongAndBch(String maHoatDong, String maBch);

    /**
     * Lấy phân công cụ thể của một BCH cho một hoạt động
     * @param maHoatDong Mã hoạt động
     * @param maBch Mã BCH
     * @return Optional của PhanCongDiemDanh
     */
    @Query("SELECT p FROM PhanCongDiemDanh p WHERE p.hoatDong.maHoatDong = ?1 AND p.bchPhuTrach.maBch = ?2 AND p.isActive = true")
    Optional<PhanCongDiemDanh> findByHoatDongAndBch(String maHoatDong, String maBch);

    /**
     * Soft delete: tắt phân công (set isActive = false)
     * @param maHoatDong Mã hoạt động
     * @param maBch Mã BCH
     */
    void deleteByHoatDongMaHoatDongAndBchPhuTrach_MaBch(String maHoatDong, String maBch);
}
