package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TnMaTran;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface TnMaTranRepository extends JpaRepository<TnMaTran, Long> {
    List<TnMaTran> findByDeThiIdOrderByThuTuAsc(Long deThiId);
    @Transactional void deleteByDeThiId(Long deThiId);
}
