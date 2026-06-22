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

    /** Tìm bản ghi CHUA_DONG theo maSv (cho 1 CLB cụ thể nếu cần) */
    @Query("SELECT p FROM DongPhiCLB p WHERE p.sinhVien.maSv = :maSv AND p.trangThai = 'CHUA_DONG' ORDER BY p.createdAt ASC")
    List<DongPhiCLB> findChuaDongBySinhVien(@Param("maSv") String maSv);

    /** Tìm theo maReference (khớp chính xác) */
    Optional<DongPhiCLB> findByMaReferenceAndTrangThai(String maReference, String trangThai);

    @Query("SELECT COUNT(p) FROM DongPhiCLB p WHERE p.cauLacBo.maClb = :maClb AND p.trangThai = 'DA_DONG'")
    long countDaDong(@Param("maClb") String maClb);

    @Query("SELECT COUNT(p) FROM DongPhiCLB p WHERE p.cauLacBo.maClb = :maClb AND p.trangThai = 'CHUA_DONG'")
    long countChuaDong(@Param("maClb") String maClb);

    List<DongPhiCLB> findBySinhVienMaSvOrderByCreatedAtDesc(String maSv);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByCauLacBoMaClbAndSinhVienMaSvAndTrangThai(String maClb, String maSv, String trangThai);
}
