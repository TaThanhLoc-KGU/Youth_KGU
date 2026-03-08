package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TickerItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TickerItemRepository extends JpaRepository<TickerItem, Long> {

    @Query("SELECT t FROM TickerItem t WHERE t.isActive = true ORDER BY t.thuTu ASC")
    List<TickerItem> findAllActive();

    @Query("SELECT t FROM TickerItem t ORDER BY t.thuTu ASC")
    List<TickerItem> findAllOrdered();
}
