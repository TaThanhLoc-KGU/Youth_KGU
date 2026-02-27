package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.ChuyenMuc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChuyenMucRepository extends JpaRepository<ChuyenMuc, Long> {

    // Lấy tất cả node gốc (cấp 1) theo thứ tự
    List<ChuyenMuc> findByParentIsNullAndIsDeletedFalseOrderByThuTuAsc();

    // Lấy con trực tiếp của một node
    List<ChuyenMuc> findByParentIdAndIsDeletedFalseOrderByThuTuAsc(Long parentId);

    // Tìm theo full_path_slug để resolve URL
    Optional<ChuyenMuc> findByFullPathSlugAndIsDeletedFalse(String fullPathSlug);

    // Lấy tất cả node thuộc subtree (dùng duongDan LIKE cho Adjacency List)
    @Query("SELECT c FROM ChuyenMuc c WHERE c.duongDan LIKE :pathPrefix% AND c.isDeleted = false ORDER BY c.cap ASC, c.thuTu ASC")
    List<ChuyenMuc> findAllInSubtree(@Param("pathPrefix") String pathPrefix);

    // Kiểm tra slug đã tồn tại chưa (loại trừ chính mình khi update)
    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsBySlug(String slug);

    // Kiểm tra còn con chưa (để từ chối xóa)
    boolean existsByParentIdAndIsDeletedFalse(Long parentId);
}
