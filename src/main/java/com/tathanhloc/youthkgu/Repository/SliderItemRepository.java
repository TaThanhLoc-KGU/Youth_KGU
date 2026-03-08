package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.SliderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SliderItemRepository extends JpaRepository<SliderItem, Long> {

    @Query("SELECT s FROM SliderItem s WHERE s.isActive = true ORDER BY s.thuTu ASC")
    List<SliderItem> findAllActive();

    @Query("SELECT s FROM SliderItem s ORDER BY s.thuTu ASC")
    List<SliderItem> findAllOrdered();
}
