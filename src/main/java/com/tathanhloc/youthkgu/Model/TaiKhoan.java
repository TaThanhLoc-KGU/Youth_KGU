package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Converter.VaiTroEnumConverter;
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
    @Column(name = "vai_tro", nullable = false)
    @Convert(converter = VaiTroEnumConverter.class)
    private VaiTroEnum vaiTro;

    // Thay thế enum BanChuyenMonEnum bằng quan hệ với bảng Ban
    @ManyToOne
    @JoinColumn(name = "ma_ban")
    private Ban banChuyenMon;

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

    /**
     * Cờ admin: true = tài khoản Quản lý có toàn quyền.
     * Chỉ áp dụng cho tài khoản QUAN_LY.
     */
    @Column(name = "la_admin")
    @Builder.Default
    private Boolean laAdmin = false;

    @ManyToOne
    @JoinColumn(name = "ma_khoa")
    private Khoa khoa; // null = Đoàn trường (không giới hạn), non-null = cán bộ cấp Khoa

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
