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

    // Lọc sinh viên theo khoa (qua Lop → Nganh → Khoa)
    @Query("SELECT sv FROM SinhVien sv WHERE sv.lop.nganh.khoa.maKhoa = :maKhoa")
    List<SinhVien> findByLopNganhKhoaMaKhoa(@Param("maKhoa") String maKhoa);

    @Query("SELECT sv FROM SinhVien sv WHERE sv.lop.nganh.khoa.maKhoa = :maKhoa AND sv.isActive = true")
    List<SinhVien> findByLopNganhKhoaMaKhoaAndIsActiveTrue(@Param("maKhoa") String maKhoa);

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

}
