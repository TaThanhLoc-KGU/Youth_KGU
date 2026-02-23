package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Model.Ban;
import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, Long> {
    // ========== Tìm kiếm cơ bản ==========
    Optional<TaiKhoan> findByUsername(String username);
    Optional<TaiKhoan> findByEmail(String email);

    // ========== Kiểm tra tồn tại ==========
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // ========== Tìm kiếm theo vai trò ==========
    List<TaiKhoan> findByVaiTro(VaiTroEnum vaiTro);
    List<TaiKhoan> findByVaiTroAndIsActiveTrue(VaiTroEnum vaiTro);

    // ========== Tìm kiếm theo ban chuyên môn ==========
    List<TaiKhoan> findByBanChuyenMon(Ban banChuyenMon);
    List<TaiKhoan> findByBanChuyenMonAndIsActiveTrue(Ban banChuyenMon);

    // ========== Tìm kiếm theo trạng thái phê duyệt ==========
    List<TaiKhoan> findByTrangThaiPheDuyet(String trangThaiPheDuyet);
    List<TaiKhoan> findByTrangThaiPheDuyetAndIsActiveTrue(String trangThaiPheDuyet);

    // ========== Tìm kiếm nâng cao ==========
    @Query("SELECT tk FROM TaiKhoan tk WHERE " +
           "LOWER(tk.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(tk.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(tk.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<TaiKhoan> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT tk FROM TaiKhoan tk WHERE " +
           "(LOWER(tk.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(tk.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(tk.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "tk.isActive = true")
    List<TaiKhoan> searchByKeywordAndActive(@Param("keyword") String keyword);

    // ========== Đếm ==========
    long countByVaiTro(VaiTroEnum vaiTro);
    long countByVaiTroAndIsActiveTrue(VaiTroEnum vaiTro);
    long countByTrangThaiPheDuyet(String trangThaiPheDuyet);
    long countByBanChuyenMon(Ban banChuyenMon);
    long countByIsActiveTrue();
    long countByIsActiveFalse();

    // ========== Lấy mã liên kết cho getWithoutAccount ==========
    @Query("SELECT tk.sinhVien.maSv FROM TaiKhoan tk WHERE tk.sinhVien IS NOT NULL")
    List<String> findAllLinkedSinhVienIds();

    @Query("SELECT tk.giangVien.maGv FROM TaiKhoan tk WHERE tk.giangVien IS NOT NULL")
    List<String> findAllLinkedGiangVienIds();

    @Query("SELECT tk.chuyenVien.maChuyenVien FROM TaiKhoan tk WHERE tk.chuyenVien IS NOT NULL")
    List<String> findAllLinkedChuyenVienIds();
}
