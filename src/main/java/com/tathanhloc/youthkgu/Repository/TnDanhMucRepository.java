package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TnDanhMuc;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TnDanhMucRepository extends JpaRepository<TnDanhMuc, Long> {
    List<TnDanhMuc> findByIsActiveTrueOrderByTenAsc();
}
