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

    /**
     * Bản có JOIN FETCH toàn bộ quan hệ mà toDTO() cần (phongHoc, nguoiPhuTrach+sinhVien, khoa, nganh,
     * cauLacBo, namHoc) — dùng riêng cho màn hình duyệt hoạt động (getChoDuyet) để tránh N+1: trước đây
     * mỗi hoạt động trả về kéo theo 4-5 SELECT phụ (lazy-load + secondary-select cho quan hệ EAGER mặc
     * định), danh sách N hoạt động chờ duyệt tốn ~4N+1 query thay vì 1.
     */
    @Query("SELECT hd FROM HoatDong hd " +
            "LEFT JOIN FETCH hd.phongHoc " +
            "LEFT JOIN FETCH hd.nguoiPhuTrach bch LEFT JOIN FETCH bch.sinhVien " +
            "LEFT JOIN FETCH hd.khoa " +
            "LEFT JOIN FETCH hd.nganh " +
            "LEFT JOIN FETCH hd.cauLacBo " +
            "LEFT JOIN FETCH hd.namHoc " +
            "WHERE hd.trangThai = :trangThai AND hd.isActive = :isActive")
    List<HoatDong> findByTrangThaiAndIsActiveFetchAll(@Param("trangThai") TrangThaiHoatDongEnum trangThai,
                                                        @Param("isActive") Boolean isActive);
    List<HoatDong> findByIsActiveTrue();
    // Lấy tất cả chưa bị xoá (isActive = true HOẶC NULL — tương thích data cũ trước khi có default)
    List<HoatDong> findByIsActiveTrueOrIsActiveIsNull();
    Page<HoatDong> findByIsActive(Boolean isActive, Pageable pageable);

    List<HoatDong> findByLoaiHoatDong(LoaiHoatDongEnum loaiHoatDong);
    List<HoatDong> findByLoaiHoatDongAndTrangThai(LoaiHoatDongEnum loaiHoatDong, TrangThaiHoatDongEnum trangThai);
    List<HoatDong> findByCapDo(CapDoEnum capDo);
    List<HoatDong> findByCapDoAndTrangThai(CapDoEnum capDo, TrangThaiHoatDongEnum trangThai);

    List<HoatDong> findByNguoiPhuTrachMaBch(String maBch);
    List<HoatDong> findByKhoaMaKhoa(String maKhoa);
    Page<HoatDong> findByKhoaMaKhoaAndIsActive(String maKhoa, Boolean isActive, Pageable pageable);
    List<HoatDong> findByNganhMaNganh(String maNganh);
    
    // CLB (Câu Lạc Bộ) related queries
    List<HoatDong> findByCauLacBoMaClbOrderByNgayToChucDesc(String maClb);
    
    @Query("SELECT hd FROM HoatDong hd WHERE hd.cauLacBo.maClb = :maClb AND hd.namHoc.maNamHoc = :maNamHoc ORDER BY hd.ngayToChuc DESC")
    List<HoatDong> findByCauLacBoMaClbAndNamHoc(@Param("maClb") String maClb, @Param("maNamHoc") String maNamHoc);

    /**
     * Khoa-scope: trả về hoạt động của khoa đó + hoạt động cấp trường (khoa = null).
     * Cán bộ khoa vẫn thấy được hoạt động do Đoàn trường tổ chức.
     */
    @Query("SELECT hd FROM HoatDong hd WHERE " +
           "(hd.khoa.maKhoa = :maKhoa OR hd.khoa IS NULL) " +
           "AND (hd.isActive = true OR hd.isActive IS NULL)")
    List<HoatDong> findByKhoaScopeOrGlobal(@Param("maKhoa") String maKhoa);

    @Query("SELECT hd FROM HoatDong hd WHERE " +
           "(hd.khoa.maKhoa = :maKhoa OR hd.khoa IS NULL) " +
           "AND hd.isActive = true")
    Page<HoatDong> findByKhoaScopeOrGlobalPaged(@Param("maKhoa") String maKhoa, Pageable pageable);

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

    // ========== PERFORMANCE QUERIES ==========

    /**
     * Trend tổng hợp 12 tháng: số hoạt động + đăng ký + điểm danh theo tháng.
     * 1 native query thay thế vòng lặp 120–240 queries trong getDashboardData().
     * Trả về: [nam (Integer), thang (Integer), soHoatDong (Long), tongDangKy (Long), tongDiemDanh (Long)]
     */
    @Query(value = "SELECT YEAR(hd.ngay_to_chuc) as nam, " +
            "MONTH(hd.ngay_to_chuc) as thang, " +
            "COUNT(DISTINCT hd.ma_hoat_dong) as so_hoat_dong, " +
            "COALESCE(SUM(dk_agg.tong_dk), 0) as tong_dang_ky, " +
            "COALESCE(SUM(dd_agg.tong_dd), 0) as tong_diem_danh " +
            "FROM hoat_dong hd " +
            "LEFT JOIN (" +
            "  SELECT ma_hoat_dong, COUNT(*) as tong_dk " +
            "  FROM dang_ky_hoat_dong WHERE is_active = true GROUP BY ma_hoat_dong" +
            ") dk_agg ON dk_agg.ma_hoat_dong = hd.ma_hoat_dong " +
            "LEFT JOIN (" +
            "  SELECT ma_hoat_dong, COUNT(*) as tong_dd " +
            "  FROM diem_danh_hoat_dong GROUP BY ma_hoat_dong" +
            ") dd_agg ON dd_agg.ma_hoat_dong = hd.ma_hoat_dong " +
            "WHERE hd.ngay_to_chuc >= :startDate AND hd.is_active = true " +
            "GROUP BY YEAR(hd.ngay_to_chuc), MONTH(hd.ngay_to_chuc) " +
            "ORDER BY nam ASC, thang ASC",
            nativeQuery = true)
    List<Object[]> findTrendDataLast12Months(@Param("startDate") LocalDate startDate);

    /**
     * Lấy các hoạt động chưa kết thúc/hủy/hoàn thành trong khoảng ngày — dùng cho auto-status scheduler
     */
    @Query("SELECT hd FROM HoatDong hd WHERE " +
            "hd.ngayToChuc BETWEEN :startDate AND :endDate " +
            "AND hd.isActive = true " +
            "AND hd.trangThai NOT IN ('DA_HUY', 'DA_HOAN_THANH')")
    List<HoatDong> findActiveNonTerminalByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}