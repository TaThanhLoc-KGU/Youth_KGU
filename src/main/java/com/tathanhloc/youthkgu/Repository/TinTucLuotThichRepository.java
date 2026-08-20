package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TinTucLuotThich;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TinTucLuotThichRepository extends JpaRepository<TinTucLuotThich, Long> {

    Optional<TinTucLuotThich> findByTinTucIdAndUsername(Long tinTucId, String username);

    Optional<TinTucLuotThich> findByTinTucIdAndDeviceId(Long tinTucId, String deviceId);
}
