package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/taikhoan")
@RequiredArgsConstructor
public class TaiKhoanController {

    private final TaiKhoanService taiKhoanService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'XEM_TAI_KHOAN')")
    public List<TaiKhoanDTO> getAll() {
        return taiKhoanService.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XEM_TAI_KHOAN')")
    public TaiKhoanDTO getById(@PathVariable Long id) {
        return taiKhoanService.getById(id);
    }

// Thay thế method create() trong TaiKhoanController.java

    @PostMapping
    @PreAuthorize("hasPermission(null, 'TAO_TAI_KHOAN')")
    public ResponseEntity<?> create(@RequestBody TaiKhoanDTO dto) {
        try {
            // Validation cơ bản
            if (dto.getUsername() == null || dto.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Username không được để trống");
            }

            if (dto.getPasswordHash() == null || dto.getPasswordHash().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Password không được để trống");
            }

            if (dto.getVaiTro() == null) {
                return ResponseEntity.badRequest().body("Vai trò không được để trống");
            }

            // Kiểm tra username đã tồn tại chưa
            if (taiKhoanService.existsByUsername(dto.getUsername())) {
                return ResponseEntity.badRequest().body("Username đã tồn tại: " + dto.getUsername());
            }

            // Set createdAt nếu null
            if (dto.getCreatedAt() == null) {
                dto.setCreatedAt(LocalDateTime.now());
            }

            // Set isActive mặc định nếu null
            if (dto.getIsActive() == null) {
                dto.setIsActive(true);
            }

            TaiKhoanDTO result = taiKhoanService.create(dto);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("❌ Error creating account: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tạo tài khoản: " + e.getMessage());
        }
    }

    // Thêm method này vào TaiKhoanController
    public boolean existsByUsername(String username) {
        return taiKhoanService.existsByUsername(username);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'SUA_TAI_KHOAN')")
    public TaiKhoanDTO update(@PathVariable Long id, @RequestBody TaiKhoanDTO dto) {
        return taiKhoanService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XOA_TAI_KHOAN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taiKhoanService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-username/{username}")
    @PreAuthorize("hasPermission(null, 'XEM_TAI_KHOAN')")
    public ResponseEntity<TaiKhoanDTO> getByUsername(@PathVariable String username) {
        return ResponseEntity.ok(taiKhoanService.getByUsername(username));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasPermission(null, 'SUA_TAI_KHOAN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> statusMap) {
        try {
            Boolean isActive = statusMap.get("isActive");
            if (isActive == null) {
                return ResponseEntity.badRequest().body("Trạng thái isActive không được để trống");
            }
            TaiKhoanDTO updatedAccount = taiKhoanService.updateStatus(id, isActive);
            return ResponseEntity.ok(updatedAccount);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi cập nhật trạng thái tài khoản: " + e.getMessage());
        }
    }

}
