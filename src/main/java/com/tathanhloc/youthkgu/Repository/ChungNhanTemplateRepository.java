package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.ChungNhanTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChungNhanTemplateRepository extends JpaRepository<ChungNhanTemplate, Long> {
    List<ChungNhanTemplate> findByIsActiveTrueOrderByCreatedAtDesc();
}
