package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DangKyThanhVienCLB;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DangKyThanhVienCLBRepository extends JpaRepository<DangKyThanhVienCLB, Long> {

    /** Đơn đăng ký của 1 CLB theo trạng thái */
    @Query("SELECT d FROM DangKyThanhVienCLB d JOIN FETCH d.sinhVien sv LEFT JOIN FETCH sv.lop " +
           "WHERE d.cauLacBo.maClb = :maClb AND d.trangThai = :trangThai ORDER BY d.createdAt DESC")
    List<DangKyThanhVienCLB> findByClbAndTrangThai(@Param("maClb") String maClb,
                                                    @Param("trangThai") String trangThai);

    /** Tất cả đơn của CLB */
    @Query("SELECT d FROM DangKyThanhVienCLB d JOIN FETCH d.sinhVien sv LEFT JOIN FETCH sv.lop " +
           "WHERE d.cauLacBo.maClb = :maClb ORDER BY d.createdAt DESC")
    List<DangKyThanhVienCLB> findAllByClb(@Param("maClb") String maClb);

    /** Đơn của sinh viên (tất cả CLB) */
    @Query("SELECT d FROM DangKyThanhVienCLB d JOIN FETCH d.cauLacBo " +
           "WHERE d.sinhVien.maSv = :maSv ORDER BY d.createdAt DESC")
    List<DangKyThanhVienCLB> findBySinhVien(@Param("maSv") String maSv);

    /** Đơn pending của sinh viên trong CLB */
    Optional<DangKyThanhVienCLB> findByCauLacBoMaClbAndSinhVienMaSvAndTrangThai(
            String maClb, String maSv, String trangThai);

    /** Đơn mới nhất của SV trong CLB (bất kỳ trạng thái) */
    @Query("SELECT d FROM DangKyThanhVienCLB d WHERE d.cauLacBo.maClb = :maClb " +
           "AND d.sinhVien.maSv = :maSv ORDER BY d.createdAt DESC")
    List<DangKyThanhVienCLB> findByClbAndSinhVien(@Param("maClb") String maClb,
                                                    @Param("maSv") String maSv);

    long countByCauLacBoMaClbAndTrangThai(String maClb, String trangThai);
}
