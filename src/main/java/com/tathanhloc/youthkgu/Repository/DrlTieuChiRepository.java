package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DrlTieuChi;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DrlTieuChiRepository extends JpaRepository<DrlTieuChi, Long> {

    List<DrlTieuChi> findByDanhMucIdOrderByThuTuAsc(Long danhMucId);
}
