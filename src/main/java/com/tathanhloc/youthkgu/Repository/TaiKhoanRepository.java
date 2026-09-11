package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Model.Ban;
import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, Long> {
    // ========== Tìm kiếm cơ bản ==========
    Optional<TaiKhoan> findByUsername(String username);
    Optional<TaiKhoan> findByEmail(String email);
    Optional<TaiKhoan> findBySinhVien_ZaloUserId(String zaloUserId);
    Optional<TaiKhoan> findBySinhVien_MaSv(String maSv);

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

    // ========== PERFORMANCE QUERIES ==========

    /**
     * Đếm tài khoản tạo trong khoảng thời gian — thay thế findAll().stream().filter() trong getStatisticsByDateRange().
     */
    @Query("SELECT COUNT(tk) FROM TaiKhoan tk " +
           "WHERE tk.createdAt >= :startDate AND tk.createdAt < :endDate")
    long countByCreatedAtBetween(@Param("startDate") LocalDateTime startDate,
                                 @Param("endDate") LocalDateTime endDate);

    /**
     * Đếm tài khoản GROUP BY ban chuyên môn — thay thế vòng lặp N query trong getAccountsByDepartmentStatistics().
     * Trả về: [maBan (String), tenBan (String), soLuong (Long)]
     */
    @Query("SELECT tk.banChuyenMon.maBan, tk.banChuyenMon.tenBan, COUNT(tk) " +
           "FROM TaiKhoan tk " +
           "WHERE tk.banChuyenMon IS NOT NULL " +
           "GROUP BY tk.banChuyenMon.maBan, tk.banChuyenMon.tenBan")
    List<Object[]> countGroupByBan();

    /**
     * Chỉ lấy username của tất cả tài khoản active — nhẹ hơn findAll() khi broadcast notification.
     */
    @Query("SELECT tk.username FROM TaiKhoan tk WHERE tk.isActive = true")
    List<String> findAllActiveUsernames();

    /**
     * Paginated search với filter — thay thế getAllAccounts() + JS filter.
     * Truyền null để bỏ qua filter đó.
     */
    /**
     * Paginated search với filter — thay thế getAllAccounts() + JS filter.
     * Truyền null để bỏ qua filter đó.
     */
    @Query("SELECT tk FROM TaiKhoan tk WHERE " +
           "(:keyword IS NULL OR LOWER(tk.hoTen) LIKE LOWER(CONCAT('%',:keyword,'%')) OR " +
           " LOWER(tk.username) LIKE LOWER(CONCAT('%',:keyword,'%')) OR " +
           " LOWER(tk.email) LIKE LOWER(CONCAT('%',:keyword,'%'))) " +
           "AND (:vaiTro IS NULL OR tk.vaiTro = :vaiTro) " +
           "AND (:isActive IS NULL OR tk.isActive = :isActive)")
    Page<TaiKhoan> searchPaged(@Param("keyword") String keyword,
                               @Param("vaiTro") VaiTroEnum vaiTro,
                               @Param("isActive") Boolean isActive,
                               Pageable pageable);

    /** Lấy trực tiếp maKhoa của user QUAN_LY — tránh lazy load khi dùng ngoài transaction */
    @Query("SELECT tk.khoa.maKhoa FROM TaiKhoan tk WHERE tk.username = :username AND tk.khoa IS NOT NULL")
    Optional<String> findMaKhoaByUsername(@Param("username") String username);

    /**
     * Lấy maKhoa của SINH_VIEN thông qua: TaiKhoan → sinhVien → lop → nganh → khoa.
     * Dùng khi TaiKhoan không có FK khoa trực tiếp (trường hợp sinh viên).
     */
    @Query("SELECT sv.lop.nganh.khoa.maKhoa FROM TaiKhoan tk " +
           "JOIN tk.sinhVien sv " +
           "WHERE tk.username = :username " +
           "AND sv.lop IS NOT NULL " +
           "AND sv.lop.nganh IS NOT NULL " +
           "AND sv.lop.nganh.khoa IS NOT NULL")
    Optional<String> findMaKhoaBySinhVienUsername(@Param("username") String username);

    /** Lấy trực tiếp maClb của tài khoản CLB — dùng cho CLB scope enforcement */
    @Query("SELECT tk.clb.maClb FROM TaiKhoan tk WHERE tk.username = :username AND tk.clb IS NOT NULL")
    Optional<String> findMaClbByUsername(@Param("username") String username);

    /** Lấy maSv của đoàn viên đang đăng nhập — tránh lazy load TaiKhoan.sinhVien ngoài transaction. */
    @Query("SELECT tk.sinhVien.maSv FROM TaiKhoan tk WHERE tk.username = :username AND tk.sinhVien IS NOT NULL")
    Optional<String> findMaSvByUsername(@Param("username") String username);

    // ========== Scope-based queries cho phân quyền đa cấp ==========

    /** Lấy tài khoản theo scope khoa */
    List<TaiKhoan> findByKhoa_MaKhoaAndIsActiveTrue(String maKhoa);

    /** Lấy tài khoản theo scope chi đoàn (lớp) */
    List<TaiKhoan> findByLop_MaLopAndIsActiveTrue(String maLop);

    /** Lấy trực tiếp maLop của tài khoản */
    @Query("SELECT tk.lop.maLop FROM TaiKhoan tk WHERE tk.username = :username AND tk.lop IS NOT NULL")
    Optional<String> findMaLopByUsername(@Param("username") String username);

    /** Tìm kiếm tài khoản theo keyword trong phạm vi khoa */
    @Query("SELECT tk FROM TaiKhoan tk WHERE tk.khoa.maKhoa = :maKhoa AND tk.isActive = true AND " +
           "(LOWER(tk.hoTen) LIKE LOWER(CONCAT('%',:kw,'%')) OR LOWER(tk.username) LIKE LOWER(CONCAT('%',:kw,'%')))")
    List<TaiKhoan> searchByKeywordAndKhoa(@Param("kw") String keyword, @Param("maKhoa") String maKhoa);
}
