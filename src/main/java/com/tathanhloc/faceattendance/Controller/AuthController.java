package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Security.CustomUserDetails;
import com.tathanhloc.faceattendance.Service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller - Username based
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "API xác thực người dùng")
public class AuthController {

    private final AuthService authService;

    /**
     * Đăng nhập
     */
    @PostMapping("/login")
    @Operation(summary = "Đăng nhập bằng username và password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
        } catch (Exception e) {
            log.error("Login failed for user: {}", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Username hoặc mật khẩu không đúng"));
        }
    }

    /**
     * Đăng ký tài khoản mới
     */
    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới")
    public ResponseEntity<ApiResponse<TaiKhoanDTO>> register(@Valid @RequestBody TaiKhoanDTO dto) {
        try {
            TaiKhoanDTO created = authService.register(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Đăng ký tài khoản thành công", created));
        } catch (Exception e) {
            log.error("Registration failed for username: {}", dto.getUsername(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Đổi mật khẩu
     */
    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            authService.changePassword(request);
            return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
        } catch (Exception e) {
            log.error("Change password failed", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Quên mật khẩu - Gửi mật khẩu tạm thời qua email
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Quên mật khẩu - Gửi mật khẩu tạm thời qua email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request);
            return ResponseEntity.ok(
                    ApiResponse.success("Mật khẩu tạm thời đã được gửi đến email của bạn", null));
        } catch (Exception e) {
            log.error("Forgot password failed", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Refresh token
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestBody RefreshTokenRequest request) {
        try {
            AuthResponse response = authService.refreshToken(request.getRefreshToken());
            return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
        } catch (Exception e) {
            log.error("Token refresh failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid refresh token"));
        }
    }

    /**
     * Lấy thông tin user hiện tại
     */
    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin user hiện tại")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Not authenticated"));
        }

        try {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

            // Build UserDTO from current user
            UserDTO userDTO = UserDTO.builder()
                    .id(userDetails.getTaiKhoan().getId())
                    .username(userDetails.getUsername())
                    .vaiTro(userDetails.getTaiKhoan().getVaiTro())
                    .isActive(userDetails.getTaiKhoan().getIsActive())
                    .build();

            // Add linked entity info
            if (userDetails.getTaiKhoan().getSinhVien() != null) {
                var sv = userDetails.getTaiKhoan().getSinhVien();
                userDTO.setHoTen(sv.getHoTen());
                userDTO.setEmail(sv.getEmail());
                userDTO.setLinkedEntityId(sv.getMaSv());
                userDTO.setLinkedEntityType("SINH_VIEN");
                if (sv.getLop() != null) {
                    userDTO.setMaLop(sv.getLop().getMaLop());
                    userDTO.setTenLop(sv.getLop().getTenLop());
                }
            } else if (userDetails.getTaiKhoan().getGiangVien() != null) {
                var gv = userDetails.getTaiKhoan().getGiangVien();
                userDTO.setHoTen(gv.getHoTen());
                userDTO.setEmail(gv.getEmail());
                userDTO.setLinkedEntityId(gv.getMaGv());
                userDTO.setLinkedEntityType("GIANG_VIEN");
                if (gv.getKhoa() != null) {
                    userDTO.setMaKhoa(gv.getKhoa().getMaKhoa());
                    userDTO.setTenKhoa(gv.getKhoa().getTenKhoa());
                }
            }

            return ResponseEntity.ok(ApiResponse.success(userDTO));
        } catch (Exception e) {
            log.error("Error getting current user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error getting user info"));
        }
    }

    /**
     * Đăng xuất
     */
    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất")
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
        if (authentication != null) {
            log.info("User logged out: {}", authentication.getName());
        }
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }
}