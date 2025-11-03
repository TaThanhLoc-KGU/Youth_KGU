package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.Ban;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BanRepository extends JpaRepository<Ban, String> {
    List<Ban> findByLoaiBanAndIsActiveTrue(String loaiBan);

    List<Ban> findByIsActiveTrueOrderByTenBanAsc();

    List<Ban> findByLoaiBanAndIsActiveTrueOrderByTenBanAsc(String loaiBan);

    List<Ban> findByKhoaMaKhoaAndIsActiveTrueOrderByTenBanAsc(String maKhoa);

    boolean existsByTenBan(String tenBan);

    @Query("SELECT COUNT(b) FROM Ban b WHERE b.isActive = true")
    long countActive();

    @Query("SELECT b.loaiBan, COUNT(b) FROM Ban b WHERE b.isActive = true GROUP BY b.loaiBan")
    List<Object[]> countByLoaiBan();
}