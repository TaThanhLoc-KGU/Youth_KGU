package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TnLuotThiCauHoi;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TnLuotThiCauHoiRepository extends JpaRepository<TnLuotThiCauHoi, Long> {
    List<TnLuotThiCauHoi> findByLuotThiIdOrderByThuTuAsc(Long luotThiId);
    Optional<TnLuotThiCauHoi> findByLuotThiIdAndCauHoiId(Long luotThiId, Long cauHoiId);
}
