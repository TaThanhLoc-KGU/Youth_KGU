package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DanhSachBanHanh;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DanhSachBanHanhRepository extends JpaRepository<DanhSachBanHanh, Long> {
    List<DanhSachBanHanh> findByMaHoatDongOrderByCreatedAtDesc(String maHoatDong);
    Optional<DanhSachBanHanh> findTopByMaHoatDongOrderByCreatedAtDesc(String maHoatDong);
    Page<DanhSachBanHanh> findByTenHoatDongContainingIgnoreCaseOrMaHoatDongContainingIgnoreCase(
            String tenHoatDong, String maHoatDong, Pageable pageable);
}
