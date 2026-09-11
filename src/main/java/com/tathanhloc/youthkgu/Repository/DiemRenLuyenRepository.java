package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DiemRenLuyen;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiemRenLuyenRepository extends JpaRepository<DiemRenLuyen, Long> {

    Optional<DiemRenLuyen> findByMaSvAndMaHocKy(String maSv, String maHocKy);

    List<DiemRenLuyen> findByMaSvOrderByMaHocKyDesc(String maSv);

    List<DiemRenLuyen> findByMaHocKy(String maHocKy);

    @Query("SELECT d FROM DiemRenLuyen d WHERE d.maHocKy = :maHocKy " +
           "AND (:trangThai IS NULL OR d.trangThai = :trangThai)")
    Page<DiemRenLuyen> findByHocKyPaged(@Param("maHocKy") String maHocKy,
                                        @Param("trangThai") String trangThai,
                                        Pageable pageable);

    boolean existsByMaSvAndMaHocKy(String maSv, String maHocKy);

    // ========== THỐNG KÊ NÂNG CAO (scope theo khoa; maKhoa = '' → toàn hệ thống) ==========

    /** Phân bố theo xếp loại. Trả [xep_loai, count] */
    @Query(value = "SELECT COALESCE(d.xep_loai, 'CHUA_XEP'), COUNT(*) " +
            "FROM diem_ren_luyen d " +
            "LEFT JOIN sinhvien sv ON d.ma_sv COLLATE utf8mb4_unicode_ci = sv.ma_sv " +
            "LEFT JOIN lop l ON sv.ma_lop = l.ma_lop " +
            "WHERE (:maKhoa = '' OR l.ma_khoa = :maKhoa) " +
            "GROUP BY d.xep_loai", nativeQuery = true)
    List<Object[]> countGroupByXepLoai(@Param("maKhoa") String maKhoa);

    /** Phân bố theo trạng thái (NHAP/DA_DUYET/KHOA). Trả [trang_thai, count] */
    @Query(value = "SELECT d.trang_thai, COUNT(*) " +
            "FROM diem_ren_luyen d " +
            "LEFT JOIN sinhvien sv ON d.ma_sv COLLATE utf8mb4_unicode_ci = sv.ma_sv " +
            "LEFT JOIN lop l ON sv.ma_lop = l.ma_lop " +
            "WHERE (:maKhoa = '' OR l.ma_khoa = :maKhoa) " +
            "GROUP BY d.trang_thai", nativeQuery = true)
    List<Object[]> countGroupByTrangThai(@Param("maKhoa") String maKhoa);

    /** Theo học kỳ. Trả [ma_hoc_ky, count, diemTB] */
    @Query(value = "SELECT d.ma_hoc_ky, COUNT(*), ROUND(AVG(d.tong_diem), 1) " +
            "FROM diem_ren_luyen d " +
            "LEFT JOIN sinhvien sv ON d.ma_sv COLLATE utf8mb4_unicode_ci = sv.ma_sv " +
            "LEFT JOIN lop l ON sv.ma_lop = l.ma_lop " +
            "WHERE (:maKhoa = '' OR l.ma_khoa = :maKhoa) " +
            "GROUP BY d.ma_hoc_ky ORDER BY d.ma_hoc_ky", nativeQuery = true)
    List<Object[]> statsGroupByHocKy(@Param("maKhoa") String maKhoa);

    /** Theo khoa. Trả [ten_khoa, count, diemTB] */
    @Query(value = "SELECT COALESCE(k.ten_khoa, 'Không xác định'), COUNT(*), ROUND(AVG(d.tong_diem), 1) " +
            "FROM diem_ren_luyen d " +
            "LEFT JOIN sinhvien sv ON d.ma_sv COLLATE utf8mb4_unicode_ci = sv.ma_sv " +
            "LEFT JOIN lop l ON sv.ma_lop = l.ma_lop " +
            "LEFT JOIN khoa k ON l.ma_khoa = k.ma_khoa " +
            "WHERE (:maKhoa = '' OR l.ma_khoa = :maKhoa) " +
            "GROUP BY k.ma_khoa, k.ten_khoa ORDER BY 3 DESC", nativeQuery = true)
    List<Object[]> statsGroupByKhoa(@Param("maKhoa") String maKhoa);
}
