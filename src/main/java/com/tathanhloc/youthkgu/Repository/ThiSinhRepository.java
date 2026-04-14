package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.ThiSinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThiSinhRepository extends JpaRepository<ThiSinh, Long> {

    List<ThiSinh> findByCuocThiIdAndIsActiveTrueOrderBySoThuTuAsc(Long cuocThiId);

    long countByCuocThiId(Long cuocThiId);

    @Modifying
    @Query("UPDATE ThiSinh t SET t.soVote = t.soVote + 1 WHERE t.id = :id")
    int incrementVote(@Param("id") Long id);
}
