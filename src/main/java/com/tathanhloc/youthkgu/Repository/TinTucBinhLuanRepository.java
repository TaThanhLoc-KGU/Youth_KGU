package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.TrangThaiBinhLuan;
import com.tathanhloc.youthkgu.Model.TinTucBinhLuan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TinTucBinhLuanRepository extends JpaRepository<TinTucBinhLuan, Long> {

    /** Bình luận công khai của 1 bài (chỉ HIEN). */
    Page<TinTucBinhLuan> findByTinTucIdAndTrangThaiOrderByCreatedAtAsc(
            Long tinTucId, TrangThaiBinhLuan trangThai, Pageable pageable);

    /** Toàn bộ bình luận của 1 bài, kể cả đã chặn/xóa — dùng cho màn kiểm duyệt. */
    Page<TinTucBinhLuan> findByTinTucIdOrderByCreatedAtDesc(Long tinTucId, Pageable pageable);
}
