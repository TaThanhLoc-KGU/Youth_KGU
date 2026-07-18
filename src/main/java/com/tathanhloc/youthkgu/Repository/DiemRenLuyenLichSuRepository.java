package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.DiemRenLuyenLichSu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiemRenLuyenLichSuRepository extends JpaRepository<DiemRenLuyenLichSu, Long> {

    List<DiemRenLuyenLichSu> findByDrlIdOrderByVersionDesc(Long drlId);

    List<DiemRenLuyenLichSu> findByMaSvAndMaHocKyOrderByVersionDesc(String maSv, String maHocKy);
}
