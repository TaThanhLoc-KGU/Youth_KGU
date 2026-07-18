package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DrlDanhMuc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DrlDanhMucRepository extends JpaRepository<DrlDanhMuc, Long> {

    List<DrlDanhMuc> findByMauIdOrderByThuTuAsc(Long mauId);
}
