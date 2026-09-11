package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TnCauHoi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TnCauHoiRepository extends JpaRepository<TnCauHoi, Long> {

    @Query("SELECT c FROM TnCauHoi c WHERE c.isActive = true " +
           "AND (:danhMucId IS NULL OR c.danhMucId = :danhMucId) " +
           "AND (:doKho IS NULL OR c.doKho = :doKho) " +
           "AND (:kw IS NULL OR LOWER(c.noiDung) LIKE LOWER(CONCAT('%', :kw, '%')))")
    Page<TnCauHoi> search(@Param("danhMucId") Long danhMucId,
                          @Param("doKho") com.tathanhloc.youthkgu.Enum.DoKhoCauHoiEnum doKho,
                          @Param("kw") String kw,
                          Pageable pageable);

    /**
     * Bốc ngẫu nhiên ID câu hỏi cho 1 "rổ" ma trận.
     * ORDER BY RAND() — chấp nhận được ở quy mô ngân hàng câu hỏi của Đoàn (vài nghìn câu).
     * Index idx_tn_ch_boc (is_active, do_kho, danh_muc_id) lo phần lọc.
     * Quy ước sentinel (native query + tham số null không ổn định trên Hibernate 6):
     *   danhMucId = 0  → mọi danh mục;   doKho = '' → mọi mức độ.
     */
    @Query(value = "SELECT id FROM tn_cau_hoi " +
            "WHERE is_active = 1 " +
            "AND (:danhMucId = 0 OR danh_muc_id = :danhMucId) " +
            "AND (:doKho = '' OR do_kho = :doKho) " +
            "ORDER BY RAND() LIMIT :soLuong", nativeQuery = true)
    List<Long> bocNgauNhien(@Param("danhMucId") long danhMucId,
                            @Param("doKho") String doKho,
                            @Param("soLuong") int soLuong);

    /** Đếm số câu khả dụng trong 1 rổ — để validate ma trận lúc tạo đề. Sentinel như bocNgauNhien(). */
    @Query(value = "SELECT COUNT(*) FROM tn_cau_hoi " +
            "WHERE is_active = 1 " +
            "AND (:danhMucId = 0 OR danh_muc_id = :danhMucId) " +
            "AND (:doKho = '' OR do_kho = :doKho)", nativeQuery = true)
    long demKhaDung(@Param("danhMucId") long danhMucId, @Param("doKho") String doKho);
}
