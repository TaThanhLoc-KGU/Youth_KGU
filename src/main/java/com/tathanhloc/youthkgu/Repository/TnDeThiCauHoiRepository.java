package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TnDeThiCauHoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface TnDeThiCauHoiRepository extends JpaRepository<TnDeThiCauHoi, Long> {
    List<TnDeThiCauHoi> findByDeThiIdOrderByThuTuAsc(Long deThiId);
    long countByDeThiId(Long deThiId);
    @Transactional void deleteByDeThiId(Long deThiId);
}
