package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import com.tathanhloc.youthkgu.Security.CustomUserDetails;
import com.tathanhloc.youthkgu.Security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service xử lý Authentication
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final TaiKhoanRepository taiKhoanRepository;
    private final SinhVienRepository sinhVienRepository;
    private final GiangVienRepository giangVienRepository;
    private final BCHDoanHoiRepository bchRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final SystemLogService systemLogService;
    private final HttpServletRequest request;


    /**
     * Đăng nhập
     */
    @Transactional
    public AuthResponse login(AuthRequest authRequest) {
        log.info("Login attempt for user: {}", authRequest.getUsername());
        try {
            // Authenticate
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getUsername(),
                            authRequest.getPassword()
                    )
            );

            // Load user details
            CustomUserDetails userDetails = (CustomUserDetails) userDetailsService
                    .loadUserByUsername(authRequest.getUsername());

            // Generate tokens
            String token = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            // Build user info
            UserDTO userDTO = buildUserDTO(userDetails.getTaiKhoan());

            log.info("Login successful for user: {}", authRequest.getUsername());
            systemLogService.log("AUTHENTICATION", "LOGIN_SUCCESS", userDetails.getUsername(), userDTO.getHoTen(),
                    "Đăng nhập thành công", SystemLog.LogLevel.INFO, "SUCCESS", request);

            return AuthResponse.builder()
                    .accessToken(token)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .user(userDTO)
                    .build();
        } catch (Exception e) {
            log.error("Login failed for user: {}", authRequest.getUsername(), e);
            systemLogService.log("AUTHENTICATION", "LOGIN_FAILED", authRequest.getUsername(), null,
                    "Đăng nhập thất bại: " + e.getMessage(), SystemLog.LogLevel.WARN, "FAILED", request);
            throw e;
        }
    }

    /**
     * Đăng ký tài khoản mới
     */
    @Transactional
    public TaiKhoanDTO register(TaiKhoanDTO dto) {
        log.info("Register new account: {}", dto.getUsername());

        // Validation
        if (dto.getUsername() == null || dto.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username không được để trống");
        }

        if (taiKhoanRepository.existsByUsername(dto.getUsername())) {
            throw new RuntimeException("Username đã tồn tại: " + dto.getUsername());
        }

        if (dto.getPasswordHash() == null || dto.getPasswordHash().trim().isEmpty()) {
            throw new RuntimeException("Mật khẩu không được để trống");
        }

        if (dto.getPasswordHash().length() < 6) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 6 ký tự");
        }

        // Set defaults
        if (dto.getCreatedAt() == null) {
            dto.setCreatedAt(LocalDateTime.now());
        }
        if (dto.getIsActive() == null) {
            dto.setIsActive(true);
        }

        // Load linked entities if provided
        SinhVien sinhVien = null;
        GiangVien giangVien = null;
        String hoTen = null;

        if (dto.getMaSv() != null) {
            sinhVien = sinhVienRepository.findById(dto.getMaSv())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + dto.getMaSv()));
            hoTen = sinhVien.getHoTen();
        }

        if (dto.getMaGv() != null) {
            giangVien = giangVienRepository.findById(dto.getMaGv())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên: " + dto.getMaGv()));
            hoTen = giangVien.getHoTen();
        }

        // Create account
        TaiKhoan taiKhoan = TaiKhoan.builder()
                .username(dto.getUsername())
                .passwordHash(passwordEncoder.encode(dto.getPasswordHash()))
                .vaiTro(dto.getVaiTro())
                .isActive(dto.getIsActive())
                .createdAt(dto.getCreatedAt())
                .sinhVien(sinhVien)
                .giangVien(giangVien)
                .build();

        TaiKhoan saved = taiKhoanRepository.save(taiKhoan);

        // Send welcome email if has linked entity with email
        sendWelcomeEmail(saved);

        log.info("Account registered successfully: {}", dto.getUsername());
        systemLogService.log("AUTHENTICATION", "REGISTER", dto.getUsername(), hoTen,
                "TaiKhoan", String.valueOf(saved.getId()), "Đăng ký tài khoản mới",
                SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);


        return toDTO(saved);
    }

    /**
     * Đổi mật khẩu
     */
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        log.info("Change password request for user: {}", request.getUsername());

        // Validate
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        // Find account
        TaiKhoan taiKhoan = taiKhoanRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), taiKhoan.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu cũ không đúng");
        }

        // Update password
        taiKhoan.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        taiKhoanRepository.save(taiKhoan);

        log.info("Password changed successfully for user: {}", request.getUsername());
        systemLogService.log("AUTHENTICATION", "CHANGE_PASSWORD",
                request.getUsername(), null,
                "Đổi mật khẩu thành công",
                SystemLog.LogLevel.INFO, "SUCCESS", this.request);
    }

    /**
     * Quên mật khẩu - Gửi mật khẩu tạm thời qua email
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        log.info("Forgot password request for user: {}", request.getUsername());

        // Find account
        TaiKhoan taiKhoan = taiKhoanRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        // Get email from linked entity
        String email = getEmailFromTaiKhoan(taiKhoan);
        if (email == null || email.isEmpty()) {
            throw new RuntimeException("Tài khoản không có email để gửi mật khẩu mới");
        }

        // Generate temporary password
        String tempPassword = generateTempPassword();

        // Update password
        taiKhoan.setPasswordHash(passwordEncoder.encode(tempPassword));
        taiKhoanRepository.save(taiKhoan);

        // Send email
        boolean emailSent = mailService.sendResetPasswordEmail(email, tempPassword);

        if (!emailSent) {
            log.warn("Failed to send reset password email to: {}", email);
            throw new RuntimeException("Không thể gửi email. Vui lòng thử lại sau.");
        }

        log.info("Temporary password sent to email: {}", email);
        systemLogService.log("AUTHENTICATION", "FORGOT_PASSWORD",
                request.getUsername(), null,
                "Cấp lại mật khẩu tạm thời qua email: " + email,
                SystemLog.LogLevel.INFO, "SUCCESS");
    }

    /**
     * Refresh token
     */
    public AuthResponse refreshToken(String refreshToken) {
        log.info("Refresh token request");

        // Extract username from refresh token
        String username = jwtService.extractUsername(refreshToken);

        // Load user
        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService
                .loadUserByUsername(username);

        // Validate refresh token
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new RuntimeException("Refresh token không hợp lệ");
        }

        // Generate new access token
        String newToken = jwtService.generateToken(userDetails);

        // Build user info
        UserDTO userDTO = buildUserDTO(userDetails.getTaiKhoan());

        return AuthResponse.builder()
                .accessToken(newToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userDTO)
                .build();
    }

    // ========== HELPER METHODS ==========

    /**
     * Build UserDTO from TaiKhoan
     */
    private UserDTO buildUserDTO(TaiKhoan taiKhoan) {
        UserDTO.UserDTOBuilder builder = UserDTO.builder()
                .id(taiKhoan.getId())
                .username(taiKhoan.getUsername())
                .vaiTro(taiKhoan.getVaiTro())
                .isActive(taiKhoan.getIsActive())
                // Lấy hoTen trực tiếp từ bảng taikhoan làm giá trị mặc định
                // (sẽ bị override bởi linked entity bên dưới nếu có)
                .hoTen(taiKhoan.getHoTen());

        // Load info from linked entity
        if (taiKhoan.getSinhVien() != null) {
            SinhVien sv = taiKhoan.getSinhVien();
            builder.hoTen(sv.getHoTen())
                    .email(sv.getEmail())
                    .linkedEntityId(sv.getMaSv())
                    .linkedEntityType("SINH_VIEN");

            if (sv.getLop() != null) {
                builder.maLop(sv.getLop().getMaLop())
                        .tenLop(sv.getLop().getTenLop());
            }
        } else if (taiKhoan.getGiangVien() != null) {
            GiangVien gv = taiKhoan.getGiangVien();
            builder.hoTen(gv.getHoTen())
                    .email(gv.getEmail())
                    .linkedEntityId(gv.getMaGv())
                    .linkedEntityType("GIANG_VIEN");

            if (gv.getKhoa() != null) {
                builder.maKhoa(gv.getKhoa().getMaKhoa())
                        .tenKhoa(gv.getKhoa().getTenKhoa());
            }
        } else if (taiKhoan.getChuyenVien() != null) {
            // Chuyên viên: linkedEntityId = maChuyenVien (cũng là maSv trong bảng sinhvien)
            // Để chuyên viên có thể đăng ký hoạt động như đoàn viên bình thường.
            ChuyenVien cv = taiKhoan.getChuyenVien();
            builder.hoTen(cv.getHoTen())
                    .email(cv.getEmail())
                    .linkedEntityId(cv.getMaChuyenVien())
                    .linkedEntityType("CHUYEN_VIEN");

            if (cv.getKhoa() != null) {
                builder.maKhoa(cv.getKhoa().getMaKhoa())
                        .tenKhoa(cv.getKhoa().getTenKhoa());
            }
        } else if (VaiTroEnum.DOAN_VIEN.equals(taiKhoan.getVaiTro())) {
            // Tài khoản sinh viên chưa được link trực tiếp: username chính là maSv
            String maSv = taiKhoan.getUsername();
            builder.linkedEntityId(maSv).linkedEntityType("SINH_VIEN");
            // Thử tìm thêm thông tin từ bảng SinhVien
            sinhVienRepository.findById(maSv).ifPresent(sv -> {
                builder.hoTen(sv.getHoTen()).email(sv.getEmail());
                if (sv.getLop() != null) {
                    builder.maLop(sv.getLop().getMaLop()).tenLop(sv.getLop().getTenLop());
                }
            });
            log.info("SINH_VIEN account '{}' has no linked SinhVien entity; using username as linkedEntityId", maSv);
        }

        return builder.build();
    }

    /**
     * Get email from TaiKhoan's linked entity
     */
    private String getEmailFromTaiKhoan(TaiKhoan taiKhoan) {
        if (taiKhoan.getSinhVien() != null) {
            return taiKhoan.getSinhVien().getEmail();
        } else if (taiKhoan.getGiangVien() != null) {
            return taiKhoan.getGiangVien().getEmail();
        }
        return null;
    }

    /**
     * Generate temporary password
     */
    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();

        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }

        return sb.toString();
    }

    /**
     * Send welcome email
     */
    private void sendWelcomeEmail(TaiKhoan taiKhoan) {
        String email = getEmailFromTaiKhoan(taiKhoan);
        if (email != null && !email.isEmpty()) {
            try {
                // You can implement welcome email logic here
                log.info("Welcome email should be sent to: {}", email);
            } catch (Exception e) {
                log.warn("Failed to send welcome email", e);
            }
        }
    }

    /**
     * Convert TaiKhoan to DTO
     */
    private TaiKhoanDTO toDTO(TaiKhoan tk) {
        return TaiKhoanDTO.builder()
                .id(tk.getId())
                .username(tk.getUsername())
                .passwordHash(tk.getPasswordHash())
                .vaiTro(tk.getVaiTro())
                .isActive(tk.getIsActive())
                .createdAt(tk.getCreatedAt())
                .maSv(tk.getSinhVien() != null ? tk.getSinhVien().getMaSv() : null)
                .maGv(tk.getGiangVien() != null ? tk.getGiangVien().getMaGv() : null)
                .build();
    }
}
