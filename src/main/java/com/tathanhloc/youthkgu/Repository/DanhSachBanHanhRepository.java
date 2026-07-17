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

    // Lấy theo hoạt động (kể cả đã hủy — để hiển thị lịch sử)
    List<DanhSachBanHanh> findByMaHoatDongOrderByCreatedAtDesc(String maHoatDong);

    // Chỉ lấy bản hiệu lực mới nhất (dùng cho public page)
    Optional<DanhSachBanHanh> findTopByMaHoatDongAndTrangThaiOrderByCreatedAtDesc(
            String maHoatDong, String trangThai);

    // Tìm kiếm toàn bộ (admin, kể cả đã hủy)
    Page<DanhSachBanHanh> findByTenHoatDongContainingIgnoreCaseOrMaHoatDongContainingIgnoreCase(
            String tenHoatDong, String maHoatDong, Pageable pageable);

    // Lọc theo trangThai + tìm kiếm
    Page<DanhSachBanHanh> findByTrangThai(String trangThai, Pageable pageable);

    Page<DanhSachBanHanh> findByTrangThaiAndTenHoatDongContainingIgnoreCaseOrTrangThaiAndMaHoatDongContainingIgnoreCase(
            String tt1, String tenHoatDong, String tt2, String maHoatDong, Pageable pageable);
}
