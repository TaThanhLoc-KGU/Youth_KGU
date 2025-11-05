package com.tathanhloc.faceattendance.Model;

import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
import com.tathanhloc.faceattendance.Enum.BanChuyenMonEnum;
import com.tathanhloc.faceattendance.Converter.VaiTroEnumConverter;
import com.tathanhloc.faceattendance.Converter.BanChuyenMonEnumConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "taikhoan")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiKhoan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3 đến 50 ký tự")
    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @NotNull(message = "Mật khẩu không được để trống")
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @NotNull(message = "Vai trò không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(name = "vai_tro", nullable = false)
    @Convert(converter = VaiTroEnumConverter.class)
    private VaiTroEnum vaiTro;

    @Enumerated(EnumType.STRING)
    @Column(name = "ban_chuyen_mon")
    @Convert(converter = BanChuyenMonEnumConverter.class)
    private BanChuyenMonEnum banChuyenMon;

    @Column(name = "ho_ten")
    private String hoTen;

    @Column(name = "so_dien_thoai")
    private String soDienThoai;

    @Column(name = "ngay_sinh")
    private LocalDate ngaySinh;

    @Column(name = "gioi_tinh")
    private String gioiTinh; // NAM, NU, KHAC

    @Column(name = "avatar", columnDefinition = "LONGTEXT")
    private String avatar; // Base64 encoded image

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "trang_thai_phe_duyet")
    @Builder.Default
    private String trangThaiPheDuyet = "CHO_PHE_DUYET"; // CHO_PHE_DUYET, DA_PHE_DUYET, TU_CHOI

    @Column(name = "ngay_phe_duyet")
    private LocalDateTime ngayPheDuyet;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne
    @JoinColumn(name = "ma_sv")
    private SinhVien sinhVien;

    @OneToOne
    @JoinColumn(name = "ma_gv")
    private GiangVien giangVien;

    @OneToOne
    @JoinColumn(name = "ma_cv")
    private ChuyenVien chuyenVien;
}
