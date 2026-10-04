package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.XacNhanHoatDongRenLuyen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface XacNhanHoatDongRenLuyenRepository extends JpaRepository<XacNhanHoatDongRenLuyen, Long> {

    List<XacNhanHoatDongRenLuyen> findByMaSvAndTrangThaiOrderByMaNamHocDescSoHocKyDesc(String maSv, String trangThai);

    Optional<XacNhanHoatDongRenLuyen> findByMaSvAndSoHocKyAndMaNamHocAndTrangThai(
            String maSv, Integer soHocKy, String maNamHoc, String trangThai);

    List<XacNhanHoatDongRenLuyen> findBySoHocKyAndMaNamHocAndTrangThaiOrderByMaSvAsc(
            Integer soHocKy, String maNamHoc, String trangThai);

    @Modifying
    @Query("UPDATE XacNhanHoatDongRenLuyen x SET x.trangThai = 'DA_HUY' " +
            "WHERE x.maSv = :maSv AND x.soHocKy = :soHocKy AND x.maNamHoc = :maNamHoc AND x.trangThai = 'HIEU_LUC'")
    void huyBanCuTruocKhiTaoLai(@Param("maSv") String maSv, @Param("soHocKy") Integer soHocKy,
                                 @Param("maNamHoc") String maNamHoc);

    long countBySoHocKyAndMaNamHocAndTrangThai(Integer soHocKy, String maNamHoc, String trangThai);
}
