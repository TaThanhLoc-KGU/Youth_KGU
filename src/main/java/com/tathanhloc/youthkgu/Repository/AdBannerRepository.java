package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.AdBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdBannerRepository extends JpaRepository<AdBanner, Long> {

    @Query("SELECT b FROM AdBanner b WHERE b.isActive = true ORDER BY b.thuTu ASC")
    List<AdBanner> findAllActive();

    @Query("SELECT b FROM AdBanner b WHERE b.isActive = true AND b.loai = :loai ORDER BY b.thuTu ASC")
    List<AdBanner> findAllActiveByLoai(@Param("loai") String loai);

    @Query("SELECT b FROM AdBanner b ORDER BY b.loai ASC, b.thuTu ASC")
    List<AdBanner> findAllOrdered();
}
