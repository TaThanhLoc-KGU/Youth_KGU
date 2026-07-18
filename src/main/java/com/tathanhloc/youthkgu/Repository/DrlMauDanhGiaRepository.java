package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DrlMauDanhGia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DrlMauDanhGiaRepository extends JpaRepository<DrlMauDanhGia, Long> {

    List<DrlMauDanhGia> findAllByOrderByCreatedAtDesc();

    List<DrlMauDanhGia> findByIsActiveTrueOrderByCreatedAtDesc();

    Optional<DrlMauDanhGia> findFirstByIsActiveTrueOrderByCreatedAtDesc();
}
