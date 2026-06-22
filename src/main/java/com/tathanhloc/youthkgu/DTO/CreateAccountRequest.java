package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO để tạo tài khoản thủ công (Admin only)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAccountRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    private String hoTen;

    private String soDienThoai;

    private LocalDate ngaySinh;

    private String gioiTinh;

    private String avatar;

    @NotNull(message = "Vai trò không được để trống")
    private VaiTroEnum vaiTro;

    // Nullable - sử dụng String để tránh lỗi JSON parsing khi gửi empty string
    private String banChuyenMon;

    /** true = QUAN_LY có toàn quyền. Chỉ dùng khi vaiTro = QUAN_LY. */
    private Boolean laAdmin;

    /** Khoa scope — null = Đoàn trường, non-null = chỉ quản lý khoa này */
    private String maKhoa;

    /** CLB scope — null = không giới hạn, non-null = chỉ quản lý CLB này */
    private String maClb;

    /** Chi đoàn scope (mã Lop) cho QUAN_LY_CHI_DOAN / PHO_CHI_DOAN */
    private String maLop;

    /** Danh sách ID quyền tùy chỉnh (override role defaults). */
    private java.util.List<Long> permissionIds;

    // Liên kết với đối tượng người dùng (nullable - chỉ set khi tạo từ danh sách)
    private String maSv;
    private String maGv;
    private String maChuyenVien;
}
