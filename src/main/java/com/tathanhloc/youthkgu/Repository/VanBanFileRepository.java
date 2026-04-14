package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.VanBanFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VanBanFileRepository extends JpaRepository<VanBanFile, Long> {

    // Tìm file của một văn bản (mỗi van_ban chỉ có đúng 1 file — VB-002)
    Optional<VanBanFile> findByVanBanId(Long vanBanId);

    boolean existsByVanBanId(Long vanBanId);
}
