package com.tathanhloc.faceattendance.Security;

import com.tathanhloc.faceattendance.Model.TaiKhoan;
import com.tathanhloc.faceattendance.Repository.TaiKhoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Custom UserDetailsService - Load user từ bảng TaiKhoan
 * Hỗ trợ username-based authentication
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final TaiKhoanRepository taiKhoanRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user by username: {}", username);

        TaiKhoan taiKhoan = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", username);
                    return new UsernameNotFoundException("Không tìm thấy tài khoản: " + username);
                });

        // Kiểm tra tài khoản có active không
        if (!taiKhoan.getIsActive()) {
            log.warn("User account is disabled: {}", username);
            throw new UsernameNotFoundException("Tài khoản đã bị vô hiệu hóa: " + username);
        }

        log.debug("User loaded successfully: {} with role: {}", username, taiKhoan.getVaiTro());
        return new CustomUserDetails(taiKhoan);
    }

    /**
     * Load user và trả về CustomUserDetails để lấy thêm thông tin
     */
    public CustomUserDetails loadUserDetailsWithTaiKhoan(String username) {
        UserDetails userDetails = loadUserByUsername(username);
        return (CustomUserDetails) userDetails;
    }
}