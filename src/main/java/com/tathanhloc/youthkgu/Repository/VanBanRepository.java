package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.TrangThaiVanBan;
import com.tathanhloc.youthkgu.Model.VanBan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VanBanRepository extends JpaRepository<VanBan, Long> {

    Optional<VanBan> findByIdAndIsDeletedFalse(Long id);

    // Search autocomplete khi tạo bài — tìm theo số hiệu hoặc trích yếu
    @Query("""
            SELECT v FROM VanBan v
            WHERE (LOWER(v.soHieu) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(v.trichYeu) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND v.trangThai = 'PUBLISHED'
              AND v.isDeleted = false
            ORDER BY v.ngayBanHanh DESC, v.createdAt DESC
            """)
    List<VanBan> searchForAutocomplete(@Param("keyword") String keyword, Pageable pageable);

    // Danh sách public (PUBLISHED, chưa xóa)
    @Query("""
            SELECT v FROM VanBan v
            WHERE v.trangThai = :trangThai
              AND v.isDeleted = false
              AND (:loai IS NULL OR v.loaiVanBan = :loai)
            ORDER BY v.ngayBanHanh DESC, v.createdAt DESC
            """)
    Page<VanBan> findPublic(
            @Param("trangThai") TrangThaiVanBan trangThai,
            @Param("loai") com.tathanhloc.youthkgu.Enum.LoaiVanBan loai,
            Pageable pageable);

    // Danh sách quản lý (tất cả trạng thái)
    Page<VanBan> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    // Kiểm tra còn van_ban dùng chuyên mục này không
    boolean existsByChuyenMucIdAndIsDeletedFalse(Long chuyenMucId);
}
