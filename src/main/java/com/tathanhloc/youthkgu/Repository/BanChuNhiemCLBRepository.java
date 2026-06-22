package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.BanChuNhiemCLB;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BanChuNhiemCLBRepository extends JpaRepository<BanChuNhiemCLB, Long> {

    List<BanChuNhiemCLB> findByCauLacBoMaClbOrderByNhiemKyDescChucVuAsc(String maClb);

    List<BanChuNhiemCLB> findByCauLacBoMaClbAndNhiemKyOrderByChucVuAsc(String maClb, String nhiemKy);

    List<BanChuNhiemCLB> findByCauLacBoMaClbAndTrangThaiOrderByChucVuAsc(String maClb, String trangThai);

    boolean existsByCauLacBoMaClbAndSinhVienMaSvAndNhiemKy(String maClb, String maSv, String nhiemKy);

    boolean existsByCauLacBoMaClbAndGiangVienMaGvAndNhiemKy(String maClb, String maGv, String nhiemKy);

    boolean existsByCauLacBoMaClbAndChuyenVienMaChuyenVienAndNhiemKy(String maClb, String maCv, String nhiemKy);

    @Query("SELECT DISTINCT b.nhiemKy FROM BanChuNhiemCLB b WHERE b.cauLacBo.maClb = :maClb ORDER BY b.nhiemKy DESC")
    List<String> findDistinctNhiemKyByClb(@Param("maClb") String maClb);

    @Query("SELECT COUNT(b) FROM BanChuNhiemCLB b WHERE b.cauLacBo.maClb = :maClb AND b.trangThai = 'DUONG_NHIEM'")
    long countDuongNhiemByClb(@Param("maClb") String maClb);
}
