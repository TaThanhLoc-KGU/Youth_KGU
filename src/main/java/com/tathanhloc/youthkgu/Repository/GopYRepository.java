package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.TrangThaiGopY;
import com.tathanhloc.youthkgu.Model.GopY;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GopYRepository extends JpaRepository<GopY, Long> {

    Page<GopY> findByNguoiGuiUsernameAndIsDeletedFalseOrderByCreatedAtDesc(String nguoiGuiUsername, Pageable pageable);

    Page<GopY> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    Page<GopY> findByTrangThaiAndIsDeletedFalseOrderByCreatedAtDesc(TrangThaiGopY trangThai, Pageable pageable);
}
