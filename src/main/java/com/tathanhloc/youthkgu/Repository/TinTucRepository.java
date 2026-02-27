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

    // Kiểm tra full_url_path đã tồn tại chưa (khi tạo bài)
    boolean existsByFullUrlPath(String fullUrlPath);

    // Kiểm tra còn bài viết dùng chuyên mục này không (để từ chối xóa CM)
    boolean existsByChuyenMucIdAndIsDeletedFalse(Long chuyenMucId);
}
