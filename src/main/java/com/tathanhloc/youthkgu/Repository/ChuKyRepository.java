package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.ChuKy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChuKyRepository extends JpaRepository<ChuKy, Long> {
    Optional<ChuKy> findFirstByLaMacDinhTrue();
}
