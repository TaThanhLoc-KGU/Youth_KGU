package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.ChuKy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChuKyRepository extends JpaRepository<ChuKy, Long> {
    Optional<ChuKy> findFirstByLaMacDinhTrue();

    /** Chữ ký của một user cụ thể (cá nhân) */
    List<ChuKy> findByOwnerUsernameOrderByCreatedAtDesc(String ownerUsername);

    /** Chữ ký mặc định của một user (để tự động chọn khi xuất PDF) */
    Optional<ChuKy> findFirstByOwnerUsernameAndLaMacDinhTrue(String ownerUsername);
}
