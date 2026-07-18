package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.SinhVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface SinhVienRepository extends JpaRepository<SinhVien, String> {
    List<SinhVien> findByLopMaLop(String maLop);
    Optional<SinhVien> findByEmail(String email);
    Optional<SinhVien> findByMaSv(String maSv);

    @Query("SELECT sv FROM SinhVien sv WHERE sv.isActive = true AND " +
           "(LOWER(sv.hoTen) LIKE LOWER(CONCAT('%',:kw,'%')) OR " +
           "LOWER(sv.maSv) LIKE LOWER(CONCAT('%',:kw,'%')) OR " +
           "LOWER(sv.email) LIKE LOWER(CONCAT('%',:kw,'%')))")
    List<SinhVien> searchByKeyword(@Param("kw") String keyword);


    @Query("SELECT COUNT(sv) FROM SinhVien sv WHERE sv.lop.maLop = :maLop AND sv.isActive = true")
    long countByLopMaLopAndIsActiveTrue(@Param("maLop") String maLop);

    // THÊM CÁC METHOD KHÁC
    List<SinhVien> findByIsActiveFalse();
    List<SinhVien> findByIsActive(Boolean isActive);
    long countByIsActiveTrue();
    boolean existsByEmail(String email);

    // Chỉ lấy maSv — nhẹ hơn findAll() rất nhiều khi broadcast notification
    @Query("SELECT sv.maSv FROM SinhVien sv WHERE sv.isActive = true")
    List<String> findAllMaSv();

    // Chỉ lấy sinh viên đang hoạt động — dùng thay findAll() để tránh load cả bảng
    List<SinhVien> findByIsActiveTrue();

    // Lọc sinh viên theo khoa (qua Lop → Nganh → Khoa)
    @Query("SELECT sv FROM SinhVien sv WHERE sv.lop.nganh.khoa.maKhoa = :maKhoa AND sv.isActive = true")
    List<SinhVien> findByLopNganhKhoaMaKhoaAndIsActiveTrue(@Param("maKhoa") String maKhoa);

    @Query("SELECT sv FROM SinhVien sv WHERE sv.lop.nganh.khoa.maKhoa = :maKhoa")
    List<SinhVien> findByLopNganhKhoaMaKhoa(@Param("maKhoa") String maKhoa);

    // Thống kê DB-level — tránh findAll() + stream filter
    @Query("SELECT sv.lop.nganh.khoa.tenKhoa, COUNT(sv) FROM SinhVien sv WHERE sv.isActive = true AND sv.lop IS NOT NULL AND sv.lop.nganh IS NOT NULL AND sv.lop.nganh.khoa IS NOT NULL GROUP BY sv.lop.nganh.khoa.tenKhoa")
    List<Object[]> countActiveGroupByKhoa();

    @Query("SELECT sv.lop.nganh.tenNganh, COUNT(sv) FROM SinhVien sv WHERE sv.isActive = true AND sv.lop IS NOT NULL AND sv.lop.nganh IS NOT NULL GROUP BY sv.lop.nganh.tenNganh")
    List<Object[]> countActiveGroupByNganh();

    @Query("SELECT sv.lop.tenLop, COUNT(sv) FROM SinhVien sv WHERE sv.isActive = true AND sv.lop IS NOT NULL GROUP BY sv.lop.tenLop")
    List<Object[]> countActiveGroupByLop();

    /**
     * Lấy maKhoa trực tiếp từ maSv — dùng cho KhoaScopeService khi TaiKhoan.sinhVien chưa được link.
     * Tài khoản sinh viên thường có username = maSv.
     */
    @Query("SELECT sv.lop.nganh.khoa.maKhoa FROM SinhVien sv " +
           "WHERE sv.maSv = :maSv " +
           "AND sv.lop IS NOT NULL " +
           "AND sv.lop.nganh IS NOT NULL " +
           "AND sv.lop.nganh.khoa IS NOT NULL")
    Optional<String> findMaKhoaByMaSv(@Param("maSv") String maSv);

    Optional<SinhVien> findByZaloUserId(String zaloUserId);

    long countByZaloUserIdNotNull();

    @org.springframework.data.jpa.repository.Query("SELECT s FROM SinhVien s WHERE s.zaloUserId IS NOT NULL ORDER BY s.hoTen ASC")
    org.springframework.data.domain.Page<SinhVien> findLinkedZaloUsers(org.springframework.data.domain.Pageable pageable);
}
