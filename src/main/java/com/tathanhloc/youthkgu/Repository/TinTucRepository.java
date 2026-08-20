package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.TrangThaiTinTuc;
import com.tathanhloc.youthkgu.Model.TinTuc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TinTucRepository extends JpaRepository<TinTuc, Long> {

    // Resolve URL → tìm bài theo full_url_path (public, chỉ PUBLISHED)
    Optional<TinTuc> findByFullUrlPathAndTrangThaiAndIsDeletedFalse(
            String fullUrlPath, TrangThaiTinTuc trangThai);

    // Tìm bài tin tức đã publish liên kết với 1 hoạt động (vd. bài tự tạo khi tạo hoạt động)
    // — dùng để lấy link web thật cho hoạt động khi gửi thông báo Zalo.
    Optional<TinTuc> findFirstByHoatDongIdAndTrangThaiAndIsDeletedFalseOrderByCreatedAtDesc(
            String hoatDongId, TrangThaiTinTuc trangThai);

    // Kiểm tra hoạt động đã có bài tin tức (tự tạo hoặc thủ công) chưa — tránh tạo trùng khi công khai lại.
    boolean existsByHoatDongIdAndIsDeletedFalse(String hoatDongId);

    // Tìm toàn bộ bài trong subtree của một chuyên mục (dùng duongDan LIKE)
    @Query("""
            SELECT t FROM TinTuc t JOIN t.chuyenMuc c
            WHERE c.duongDan LIKE :pathPrefix%
              AND t.trangThai = :trangThai
              AND t.isDeleted = false
            ORDER BY t.isGhim DESC, t.ngayXuatBan DESC
            """)
    Page<TinTuc> findByChuyenMucSubtree(
            @Param("pathPrefix") String pathPrefix,
            @Param("trangThai") TrangThaiTinTuc trangThai,
            Pageable pageable);

    // Tìm bài kèm tìm kiếm từ khóa
    @Query("""
            SELECT t FROM TinTuc t JOIN t.chuyenMuc c
            WHERE c.duongDan LIKE :pathPrefix%
              AND t.trangThai = :trangThai
              AND t.isDeleted = false
              AND (LOWER(t.tieuDe) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(t.tomTat) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY t.isGhim DESC, t.ngayXuatBan DESC
            """)
    Page<TinTuc> findByChuyenMucSubtreeAndKeyword(
            @Param("pathPrefix") String pathPrefix,
            @Param("trangThai") TrangThaiTinTuc trangThai,
            @Param("keyword") String keyword,
            Pageable pageable);

    // Cascade update full_url_path khi chuyên mục đổi slug (CM-001)
    @Modifying
    @Query("""
            UPDATE TinTuc t SET t.fullUrlPath = REPLACE(t.fullUrlPath, :oldPath, :newPath)
            WHERE t.chuyenMuc.id = :chuyenMucId
            """)
    void updateFullUrlPathByChuyenMucId(
            @Param("chuyenMucId") Long chuyenMucId,
            @Param("oldPath") String oldPath,
            @Param("newPath") String newPath);

    // Danh sách bài của người tạo (BCH quản lý bài của mình)
    Page<TinTuc> findByNguoiTaoAndIsDeletedFalseOrderByCreatedAtDesc(String nguoiTao, Pageable pageable);

    // Toàn bộ bài (ADMIN/MANAGER xem tất cả)
    Page<TinTuc> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    // Tìm kiếm bài quản lý theo keyword và/hoặc trangThai (dùng cho manage endpoint)
    @Query("""
            SELECT t FROM TinTuc t
            WHERE t.isDeleted = false
              AND (:trangThai IS NULL OR t.trangThai = :trangThai)
              AND (:keyword IS NULL OR :keyword = ''
                   OR LOWER(t.tieuDe) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(COALESCE(t.tomTat, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY t.createdAt DESC
            """)
    Page<TinTuc> searchManage(
            @Param("keyword") String keyword,
            @Param("trangThai") TrangThaiTinTuc trangThai,
            Pageable pageable);

    // Kiểm tra full_url_path đã tồn tại chưa (khi tạo bài)
    boolean existsByFullUrlPath(String fullUrlPath);

    // Kiểm tra còn bài viết dùng chuyên mục này không (để từ chối xóa CM)
    boolean existsByChuyenMucIdAndIsDeletedFalse(Long chuyenMucId);

    // Lọc tin tức theo khoa (admin)
    Page<TinTuc> findByKhoaMaKhoaAndIsDeletedFalseOrderByCreatedAtDesc(
            String maKhoa, Pageable pageable);

    // Lọc tin tức theo khoa + từ khóa (admin)
    @Query("SELECT t FROM TinTuc t WHERE t.khoa.maKhoa = :maKhoa AND t.isDeleted = false " +
           "AND (:keyword IS NULL OR LOWER(t.tieuDe) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
           " ORDER BY t.createdAt DESC")
    Page<TinTuc> findByKhoaAndKeyword(@Param("maKhoa") String maKhoa,
                                       @Param("keyword") String keyword,
                                       Pageable pageable);

    // Public: lọc tin đã published theo khoa
    @Query("SELECT t FROM TinTuc t WHERE t.khoa.maKhoa = :maKhoa " +
           "AND t.trangThai = :trangThai AND t.isDeleted = false ORDER BY t.createdAt DESC")
    Page<TinTuc> findPublishedByKhoa(@Param("maKhoa") String maKhoa,
                                      @Param("trangThai") com.tathanhloc.youthkgu.Enum.TrangThaiTinTuc trangThai,
                                      Pageable pageable);

    // Public: lọc tin đã published theo đơn vị đăng (Tên CLB)
    @Query("SELECT t FROM TinTuc t WHERE t.donViDang = :donViDang " +
           "AND t.trangThai = :trangThai AND t.isDeleted = false ORDER BY t.createdAt DESC")
    Page<TinTuc> findPublishedByDonViDang(@Param("donViDang") String donViDang,
                                      @Param("trangThai") com.tathanhloc.youthkgu.Enum.TrangThaiTinTuc trangThai,
                                      Pageable pageable);

    // ── Tương tác: tăng/giảm nguyên tử (tránh lost-update khi bấm nhanh) ──────
    // clearAutomatically = true là BẮT BUỘC: bulk UPDATE (@Modifying) không tự động cập nhật
    // persistence context. Nếu không clear, entity TinTuc đã load trước đó trong CÙNG transaction
    // (vd. loadTinTuc() ở đầu TinTucTuongTacService.toggleLike()) vẫn còn trong first-level cache
    // của Hibernate — gọi lại findById() ngay sau increment sẽ trả về bản ghi CŨ (số đếm sai),
    // không phải giá trị vừa UPDATE trong DB.

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TinTuc t SET t.luotThich = t.luotThich + 1 WHERE t.id = :id")
    void incrementLuotThich(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TinTuc t SET t.luotThich = GREATEST(t.luotThich - 1, 0) WHERE t.id = :id")
    void decrementLuotThich(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TinTuc t SET t.luotBinhLuan = t.luotBinhLuan + 1 WHERE t.id = :id")
    void incrementLuotBinhLuan(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TinTuc t SET t.luotBinhLuan = GREATEST(t.luotBinhLuan - 1, 0) WHERE t.id = :id")
    void decrementLuotBinhLuan(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TinTuc t SET t.luotChiaSe = t.luotChiaSe + 1 WHERE t.id = :id")
    void incrementLuotChiaSe(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TinTuc t SET t.khoaBinhLuan = :khoa WHERE t.id = :id")
    void updateKhoaBinhLuan(@Param("id") Long id, @Param("khoa") boolean khoa);

    /**
     * Backfill 1 lần cho các bài viết TẠO TRƯỚC KHI 4 cột tương tác (luot_thich/luot_binh_luan/
     * luot_chia_se/khoa_binh_luan) được thêm vào bảng — Hibernate ddl-auto=update chỉ ALTER TABLE
     * thêm cột mới với giá trị NULL cho các dòng đã có, KHÔNG áp @Builder.Default cho dữ liệu cũ.
     * Nếu không backfill, các phép tăng nguyên tử (SET x = x + 1) trên dòng NULL sẽ mãi mãi ra NULL
     * (NULL + 1 = NULL trong SQL) — gọi ở DataInitializer, idempotent (chạy lại vô hại, WHERE rỗng).
     */
    @Modifying
    @Query(value = "UPDATE tin_tuc SET " +
            "luot_thich = COALESCE(luot_thich, 0), " +
            "luot_binh_luan = COALESCE(luot_binh_luan, 0), " +
            "luot_chia_se = COALESCE(luot_chia_se, 0), " +
            "khoa_binh_luan = COALESCE(khoa_binh_luan, false) " +
            "WHERE luot_thich IS NULL OR luot_binh_luan IS NULL " +
            "OR luot_chia_se IS NULL OR khoa_binh_luan IS NULL",
            nativeQuery = true)
    int backfillNullTuongTacCounters();
}
