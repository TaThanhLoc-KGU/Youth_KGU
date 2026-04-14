package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.CauHinhEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CauHinhEmailRepository extends JpaRepository<CauHinhEmail, Long> {
    Optional<CauHinhEmail> findFirstByOrderByIdAsc();
}
