package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
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

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
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
}
