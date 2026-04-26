package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.ThanhVienCLB;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThanhVienCLBRepository extends JpaRepository<ThanhVienCLB, Long> {

    // ── Lấy danh sách thành viên ────────────────────────────────────────────────

    List<ThanhVienCLB> findByCauLacBoMaClbAndIsActiveTrueOrderByChucVuAsc(String maClb);

    /** Thành viên theo học kỳ */
    List<ThanhVienCLB> findByCauLacBoMaClbAndHocKyMaHocKyAndIsActiveTrueOrderByChucVuAsc(
            String maClb, String maHocKy);

    /** Các CLB mà một sinh viên tham gia */
    List<ThanhVienCLB> findBySinhVienMaSvAndIsActiveTrue(String maSv);

    /** Kiểm tra sinh viên đã là thành viên CLB trong HK này chưa */
    Optional<ThanhVienCLB> findByCauLacBoMaClbAndSinhVienMaSvAndHocKyMaHocKy(
            String maClb, String maSv, String maHocKy);

    Optional<ThanhVienCLB> findByCauLacBoMaClbAndSinhVienMaSvAndHocKyIsNull(
            String maClb, String maSv);

    // ── Thống kê ────────────────────────────────────────────────────────────────

    long countByCauLacBoMaClbAndIsActiveTrue(String maClb);

    long countByCauLacBoMaClbAndHocKyMaHocKyAndIsActiveTrue(String maClb, String maHocKy);

    /** Số thành viên active theo từng CLB — dùng cho danh sách CLB */
    @Query("SELECT tv.cauLacBo.maClb, COUNT(tv) FROM ThanhVienCLB tv " +
           "WHERE tv.isActive = true GROUP BY tv.cauLacBo.maClb")
    List<Object[]> countActiveGroupByClb();

    /** Kiểm tra trùng (bất kể học kỳ) */
    boolean existsByCauLacBoMaClbAndSinhVienMaSvAndIsActiveTrue(String maClb, String maSv);
}
