package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Model.SystemLog;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Security.CustomUserDetails;
import com.tathanhloc.youthkgu.Service.AuthService;
import com.tathanhloc.youthkgu.Service.SystemLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
    private final SystemLogService systemLogService;

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
            TaiKhoan taiKhoan = userDetails.getTaiKhoan();

            // Build UserDTO from current user
            UserDTO userDTO = UserDTO.builder()
                    .id(taiKhoan.getId())
                    .username(userDetails.getUsername())
                    .vaiTro(taiKhoan.getVaiTro())
                    .isActive(taiKhoan.getIsActive())
                    .build();

            // Add linked entity info
            if (taiKhoan.getSinhVien() != null) {
                var sv = taiKhoan.getSinhVien();
                userDTO.setHoTen(sv.getHoTen());
                userDTO.setEmail(sv.getEmail());
                userDTO.setLinkedEntityId(sv.getMaSv());
                userDTO.setLinkedEntityType("SINH_VIEN");
                if (sv.getLop() != null) {
                    userDTO.setMaLop(sv.getLop().getMaLop());
                    userDTO.setTenLop(sv.getLop().getTenLop());
                }
            } else if (taiKhoan.getGiangVien() != null) {
                var gv = taiKhoan.getGiangVien();
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
     * Đăng nhập bằng Zalo Mini App access token
     */
    @PostMapping("/zalo-login")
    @Operation(summary = "Đăng nhập bằng Zalo access token (Mini App)")
    public ResponseEntity<ApiResponse<AuthResponse>> zaloLogin(
            @RequestBody ZaloLoginRequest request) {
        try {
            AuthResponse response = authService.loginWithZalo(request.getAccessToken());
            return ResponseEntity.ok(ApiResponse.success("Đăng nhập Zalo thành công", response));
        } catch (com.tathanhloc.youthkgu.Exception.ZaloNotLinkedException e) {
            // Chưa liên kết MSSV — trả 200 kèm errorCode riêng để FE hiển thị form nhập MSSV,
            // không phải lỗi xác thực thật sự nên không dùng 401 (tránh bị interceptor FE xử lý như phiên hết hạn).
            return ResponseEntity.ok(ApiResponse.error(e.getMessage(), ZALO_NOT_LINKED_CODE));
        } catch (Exception e) {
            log.error("Zalo login failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    private static final int ZALO_NOT_LINKED_CODE = 4041;

    @lombok.Data
    public static class ZaloLoginRequest {
        private String accessToken;
    }

    /**
     * Liên kết mã số sinh viên với tài khoản Zalo hiện tại rồi đăng nhập luôn (self-service từ Mini App).
     */
    @PostMapping("/zalo-link")
    @Operation(summary = "Liên kết mã số sinh viên với tài khoản Zalo rồi đăng nhập")
    public ResponseEntity<ApiResponse<AuthResponse>> zaloLink(
            @RequestBody ZaloLinkRequest request) {
        try {
            AuthResponse response = authService.linkZaloAndLogin(request.getAccessToken(), request.getMaSv());
            return ResponseEntity.ok(ApiResponse.success("Liên kết tài khoản thành công", response));
        } catch (Exception e) {
            log.error("Zalo link failed", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @lombok.Data
    public static class ZaloLinkRequest {
        private String accessToken;
        private String maSv;
    }

    /**
     * Đăng xuất
     */
    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất")
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication,
                                                     HttpServletRequest request) {
        if (authentication != null) {
            String username = authentication.getName();
            log.info("User logged out: {}", username);
            String hoTen = null;
            try {
                CustomUserDetails ud = (CustomUserDetails) authentication.getPrincipal();
                TaiKhoan tk = ud.getTaiKhoan();
                if (tk.getSinhVien() != null) hoTen = tk.getSinhVien().getHoTen();
                else if (tk.getGiangVien() != null) hoTen = tk.getGiangVien().getHoTen();
                else hoTen = tk.getHoTen();
            } catch (Exception ignored) {}
            systemLogService.log("AUTHENTICATION", "LOGOUT", username, hoTen,
                    "Đăng xuất thành công", SystemLog.LogLevel.INFO, "SUCCESS", request);
        }
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }
}
