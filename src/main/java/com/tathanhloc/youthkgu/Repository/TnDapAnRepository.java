package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TnDapAn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TnDapAnRepository extends JpaRepository<TnDapAn, Long> {
    List<TnDapAn> findByCauHoiIdOrderByThuTuAsc(Long cauHoiId);
    List<TnDapAn> findByCauHoiIdInOrderByThuTuAsc(List<Long> cauHoiIds);
}
