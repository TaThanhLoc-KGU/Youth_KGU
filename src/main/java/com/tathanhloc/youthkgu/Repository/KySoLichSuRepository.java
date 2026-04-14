package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.KySoLichSu;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KySoLichSuRepository extends JpaRepository<KySoLichSu, Long> {
    List<KySoLichSu> findByMaHoatDongOrderByCreatedAtDesc(String maHoatDong);
    Page<KySoLichSu> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
