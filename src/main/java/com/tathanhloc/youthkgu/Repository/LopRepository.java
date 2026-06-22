package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.Lop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface LopRepository extends JpaRepository<Lop, String> {
    List<Lop> findByNganhMaNganh(String maNganh);
    List<Lop> findByKhoaHocMaKhoahoc(String maKhoahoc);
    Collection<Object> findByMaLop(String maLop);

    // Soft delete
    List<Lop> findByIsActiveTrue();
    List<Lop> findByIsActiveFalse();
    long countByIsActiveTrue();
    long countByIsActiveFalse();

    // Loc theo loai: LOP hoac CHI_DOAN
    List<Lop> findByLoaiAndIsActiveTrue(String loai);
    List<Lop> findByLoai(String loai);
    long countByLoaiAndIsActiveTrue(String loai);
    List<Lop> findByMaKhoa_MaKhoaAndLoai(String maKhoa, String loai);
}
