package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    List<EmailTemplate> findByIsActiveTrueOrderByTenMauAsc();
}
