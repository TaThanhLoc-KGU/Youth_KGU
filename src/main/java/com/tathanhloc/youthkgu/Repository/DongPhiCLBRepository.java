package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DongPhiCLB;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface DongPhiCLBRepository extends JpaRepository<DongPhiCLB, Long> {

    List<DongPhiCLB> findByCauLacBoMaClbOrderBySinhVienHoTenAsc(String maClb);

    List<DongPhiCLB> findByCauLacBoMaClbAndHocKyMaHocKy(String maClb, String maHocKy);

    Optional<DongPhiCLB> findByCauLacBoMaClbAndSinhVienMaSvAndHocKyMaHocKy(
            String maClb, String maSv, String maHocKy);

    Optional<DongPhiCLB> findByTransactionId(String transactionId);

    boolean existsByTransactionId(String transactionId);

    @Query("SELECT COUNT(p) FROM DongPhiCLB p WHERE p.cauLacBo.maClb = :maClb AND p.trangThai = 'DA_DONG'")
    long countDaDong(@Param("maClb") String maClb);

    @Query("SELECT COUNT(p) FROM DongPhiCLB p WHERE p.cauLacBo.maClb = :maClb AND p.trangThai = 'CHUA_DONG'")
    long countChuaDong(@Param("maClb") String maClb);
}
