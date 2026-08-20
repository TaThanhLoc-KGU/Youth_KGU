package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.ConDau;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConDauRepository extends JpaRepository<ConDau, Long> {
    Optional<ConDau> findFirstByLaMacDinhTrue();

    /** Con dấu dùng được bởi 1 user: dùng chung (owner NULL) hoặc sở hữu riêng. */
    List<ConDau> findByOwnerUsernameIsNullOrOwnerUsername(String ownerUsername);
}
