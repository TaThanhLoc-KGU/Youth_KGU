package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.Model.TaiKhoan;
import com.tathanhloc.faceattendance.Repository.TaiKhoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * DEBUG CONTROLLER - CHỈ DÙNG ĐỂ TEST, XÓA SAU KHI DEPLOY
 */
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final TaiKhoanRepository taiKhoanRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Kiểm tra user có tồn tại trong database không
     */
    @GetMapping("/check-user/{username}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkUser(@PathVariable String username) {
        Map<String, Object> result = new HashMap<>();

        Optional<TaiKhoan> taiKhoanOpt = taiKhoanRepository.findByUsername(username);

        if (taiKhoanOpt.isPresent()) {
            TaiKhoan tk = taiKhoanOpt.get();
            result.put("exists", true);
            result.put("id", tk.getId());
            result.put("username", tk.getUsername());
            result.put("vaiTro", tk.getVaiTro());
            result.put("isActive", tk.getIsActive());
            result.put("passwordHashLength", tk.getPasswordHash().length());
            result.put("passwordHashPrefix", tk.getPasswordHash().substring(0, 10) + "...");
        } else {
            result.put("exists", false);
            result.put("message", "User không tồn tại trong database");
        }

        return ResponseEntity.ok(ApiResponse.success("Check user result", result));
    }

    /**
     * Test password matching
     */
    @PostMapping("/test-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testPassword(
            @RequestParam String username,
            @RequestParam String plainPassword) {

        Map<String, Object> result = new HashMap<>();

        Optional<TaiKhoan> taiKhoanOpt = taiKhoanRepository.findByUsername(username);

        if (taiKhoanOpt.isEmpty()) {
            result.put("error", "User không tồn tại");
            return ResponseEntity.ok(ApiResponse.error("User not found"));
        }

        TaiKhoan tk = taiKhoanOpt.get();
        String storedHash = tk.getPasswordHash();

        // Test password matching
        boolean matches = passwordEncoder.matches(plainPassword, storedHash);

        result.put("username", username);
        result.put("plainPasswordLength", plainPassword.length());
        result.put("storedHashLength", storedHash.length());
        result.put("storedHashPrefix", storedHash.substring(0, 20) + "...");
        result.put("passwordMatches", matches);
        result.put("isActive", tk.getIsActive());
        result.put("vaiTro", tk.getVaiTro());

        // Generate new hash for comparison
        String newHash = passwordEncoder.encode(plainPassword);
        result.put("newHashGenerated", newHash.substring(0, 20) + "...");
        result.put("newHashMatches", passwordEncoder.matches(plainPassword, newHash));

        return ResponseEntity.ok(ApiResponse.success("Password test result", result));
    }

    /**
     * Tạo SQL để update password
     */
    @GetMapping("/generate-update-sql/{username}/{plainPassword}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateUpdateSQL(
            @PathVariable String username,
            @PathVariable String plainPassword) {

        String newHash = passwordEncoder.encode(plainPassword);

        Map<String, Object> result = new HashMap<>();
        result.put("plainPassword", plainPassword);
        result.put("newHash", newHash);
        result.put("sql", String.format(
                "UPDATE taikhoan SET password_hash = '%s' WHERE username = '%s';",
                newHash, username
        ));

        return ResponseEntity.ok(ApiResponse.success("SQL generated", result));
    }

    /**
     * Liệt kê tất cả users trong database
     */
    @GetMapping("/list-users")
    public ResponseEntity<ApiResponse<?>> listUsers() {
        var users = taiKhoanRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("All users", users));
    }
}