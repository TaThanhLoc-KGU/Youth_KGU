package com.tathanhloc.faceattendance.Model;

import com.tathanhloc.faceattendance.Enum.LoaiThanhVienEnum;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bch_doan_hoi")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BCHDoanHoi {

    @Id
    @Column(name = "ma_bch", length = 50)
    private String maBch;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_thanh_vien", nullable = false)
    private LoaiThanhVienEnum loaiThanhVien;

    // Chỉ 1 trong 3 có giá trị
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_sv")
    private SinhVien sinhVien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_gv")
    private GiangVien giangVien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_chuyen_vien")
    private ChuyenVien chuyenVien;

    @Column(name = "nhiem_ky", length = 20)
    private String nhiemKy;

    @Column(name = "ngay_bat_dau")
    private LocalDate ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDate ngayKetThuc;

    @Column(name = "hinh_anh", length = 500)
    private String hinhAnh;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ========== HELPER METHODS ==========

    /**
     * Lấy họ tên theo loại thành viên
     */
    public String getHoTen() {
        switch (loaiThanhVien) {
            case SINH_VIEN:
                return sinhVien != null ? sinhVien.getHoTen() : null;
            case GIANG_VIEN:
                return giangVien != null ? giangVien.getHoTen() : null;
            case CHUYEN_VIEN:
                return chuyenVien != null ? chuyenVien.getHoTen() : null;
            default:
                return null;
        }
    }

    /**
     * Lấy email theo loại thành viên
     */
    public String getEmail() {
        switch (loaiThanhVien) {
            case SINH_VIEN:
                return sinhVien != null ? sinhVien.getEmail() : null;
            case GIANG_VIEN:
                return giangVien != null ? giangVien.getEmail() : null;
            case CHUYEN_VIEN:
                return chuyenVien != null ? chuyenVien.getEmail() : null;
            default:
                return null;
        }
    }

    /**
     * Lấy số điện thoại theo loại thành viên
     */
    public String getSoDienThoai() {
        switch (loaiThanhVien) {
            case SINH_VIEN:
                return sinhVien != null ? sinhVien.getSdt() : null;
            case GIANG_VIEN:
                return null; // GiangVien không có field sdt
            case CHUYEN_VIEN:
                return chuyenVien != null ? chuyenVien.getSdt() : null;
            default:
                return null;
        }
    }

    /**
     * Lấy mã thành viên theo loại
     */
    public String getMaThanhVien() {
        switch (loaiThanhVien) {
            case SINH_VIEN:
                return sinhVien != null ? sinhVien.getMaSv() : null;
            case GIANG_VIEN:
                return giangVien != null ? giangVien.getMaGv() : null;
            case CHUYEN_VIEN:
                return chuyenVien != null ? chuyenVien.getMaChuyenVien() : null;
            default:
                return null;
        }
    }

    /**
     * Lấy đơn vị (Lớp cho SV, Khoa cho GV/CV)
     */
    public String getDonVi() {
        switch (loaiThanhVien) {
            case SINH_VIEN:
                return sinhVien != null && sinhVien.getLop() != null
                        ? sinhVien.getLop().getTenLop() : null;
            case GIANG_VIEN:
                return giangVien != null && giangVien.getKhoa() != null
                        ? giangVien.getKhoa().getTenKhoa() : null;
            case CHUYEN_VIEN:
                return chuyenVien != null && chuyenVien.getKhoa() != null
                        ? chuyenVien.getKhoa().getTenKhoa() : null;
            default:
                return null;
        }
    }
}