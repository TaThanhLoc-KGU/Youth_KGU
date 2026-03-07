package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.*;
import com.tathanhloc.youthkgu.Model.HoatDong;
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
            "OR LOWER(hd.maHoatDong) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(hd.moTa) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND hd.trangThai <> com.tathanhloc.youthkgu.Enum.TrangThaiHoatDongEnum.DA_HUY " +
            "ORDER BY hd.ngayToChuc DESC")
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

    /** GROUP BY loại hoạt động — thay thế vòng lặp N query trong getActivityStatisticsOverview() */
    @Query("SELECT hd.loaiHoatDong, COUNT(hd) FROM HoatDong hd " +
            "WHERE hd.isActive = true GROUP BY hd.loaiHoatDong")
    List<Object[]> countByLoaiHoatDong();

    /** GROUP BY cấp độ — thay thế vòng lặp N query */
    @Query("SELECT hd.capDo, COUNT(hd) FROM HoatDong hd " +
            "WHERE hd.isActive = true GROUP BY hd.capDo")
    List<Object[]> countByCapDo();

    /** Tổng điểm rèn luyện toàn bộ hoạt động active */
    @Query("SELECT COALESCE(SUM(hd.diemRenLuyen), 0), COUNT(hd) FROM HoatDong hd " +
            "WHERE hd.isActive = true AND hd.diemRenLuyen IS NOT NULL")
    Object[] sumAndCountDiemRenLuyen();

    /** Map mã hoạt động → số đăng ký, dùng cho bulk load tránh N+1 */
    @Query("SELECT dk.hoatDong.maHoatDong, COUNT(dk) FROM DangKyHoatDong dk " +
            "WHERE dk.isActive = true GROUP BY dk.hoatDong.maHoatDong")
    List<Object[]> countDangKyGroupByHoatDong();
}