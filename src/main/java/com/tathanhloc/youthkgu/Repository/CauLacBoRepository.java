package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.CauLacBo;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CauLacBoRepository extends JpaRepository<CauLacBo, String> {

    // ── Lấy danh sách ──────────────────────────────────────────────────────────

    @EntityGraph(attributePaths = {"khoa", "ban", "truongClb"})
    List<CauLacBo> findByIsActiveTrueOrderByTenClbAsc();

    @EntityGraph(attributePaths = {"khoa", "ban", "truongClb"})
    List<CauLacBo> findByLoaiAndIsActiveTrueOrderByTenClbAsc(String loai);

    /** CLB cấp trường (khoa IS NULL) */
    @EntityGraph(attributePaths = {"khoa", "ban", "truongClb"})
    List<CauLacBo> findByKhoaIsNullAndIsActiveTrueOrderByTenClbAsc();

    /** CLB cấp khoa */
    @EntityGraph(attributePaths = {"khoa", "ban", "truongClb"})
    List<CauLacBo> findByKhoaMaKhoaAndIsActiveTrueOrderByTenClbAsc(String maKhoa);

    /** Tìm theo ban quản lý */
    List<CauLacBo> findByBanMaBanAndIsActiveTrue(String maBan);

    // ── Chi tiết (kèm thành viên) ───────────────────────────────────────────────

    @EntityGraph(attributePaths = {"khoa", "ban", "truongClb"})
    Optional<CauLacBo> findByMaClb(String maClb);

    // ── Tìm kiếm ───────────────────────────────────────────────────────────────

    @Query("SELECT c FROM CauLacBo c WHERE " +
           "(LOWER(c.tenClb) LIKE LOWER(CONCAT('%', :kw, '%')) " +
           "OR LOWER(c.linhVuc) LIKE LOWER(CONCAT('%', :kw, '%'))) " +
           "AND c.isActive = true ORDER BY c.tenClb ASC")
    @EntityGraph(attributePaths = {"khoa", "ban", "truongClb"})
    List<CauLacBo> searchByKeyword(@Param("kw") String kw);

    // ── Thống kê ───────────────────────────────────────────────────────────────

    long countByIsActiveTrue();

    @Query("SELECT c.loai, COUNT(c) FROM CauLacBo c WHERE c.isActive = true GROUP BY c.loai")
    List<Object[]> countGroupByLoai();

    boolean existsByTenClb(String tenClb);
    boolean existsByMaClb(String maClb);

    /** CLB theo người quản lý (dùng cho GV/CV làm chủ nhiệm) */
    @EntityGraph(attributePaths = {"khoa", "ban", "truongClb"})
    List<CauLacBo> findByMaQuanLyAndIsActiveTrueOrderByTenClbAsc(String maQuanLy);

    /** CLB theo sinh viên trưởng CLB */
    @EntityGraph(attributePaths = {"khoa", "ban", "truongClb"})
    List<CauLacBo> findByTruongClbMaSvAndIsActiveTrueOrderByTenClbAsc(String maSv);
}
