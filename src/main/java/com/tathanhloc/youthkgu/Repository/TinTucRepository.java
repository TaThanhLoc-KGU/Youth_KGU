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
}
