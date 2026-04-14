package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.Service.PermissionService;
import com.tathanhloc.youthkgu.payload.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionController {

    private final PermissionService service;

    /** Lấy quyền của chính mình — mọi user đã đăng nhập đều gọi được. */
    @GetMapping("/me")
    public ResponseEntity<?> getMyPermissions(Principal principal) {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getMyPermissions(principal.getName())).build());
    }

    /** Lấy danh sách tất cả permissions nhóm theo category (dùng cho UI checkbox). */
    @GetMapping("/all")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<?> getAllGrouped() {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getAllPermissionsGrouped()).build());
    }

    /** Lấy danh sách permission IDs đang được gán cho tài khoản. */
    @GetMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<?> getAccountPermissions(@PathVariable Long taiKhoanId) {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getAccountPermissions(taiKhoanId)).build());
    }

    /**
     * Gán quyền cho tài khoản (atomic replace — xóa cũ, insert mới).
     * Body: { "permissionIds": [1, 2, 3, ...], "laAdmin": false }
     */
    @PutMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<?> setAccountPermissions(@PathVariable Long taiKhoanId,
            @RequestBody Map<String, Object> body, Principal principal) {
        try {
            boolean laAdmin = Boolean.TRUE.equals(body.get("laAdmin"));

            // Lấy ID người thực hiện
            Long adminId = null;
            try {
                adminId = ((Number) body.get("adminId")).longValue();
            } catch (Exception ignored) {}

            // Cập nhật cờ laAdmin
            service.setLaAdmin(taiKhoanId, laAdmin, adminId);

            // Nếu không phải admin, gán danh sách quyền cụ thể
            if (!laAdmin) {
                @SuppressWarnings("unchecked")
                List<Long> permissionIds = ((List<Integer>) body.getOrDefault("permissionIds", List.of()))
                        .stream().map(Long::valueOf).collect(Collectors.toList());
                service.setAccountPermissions(taiKhoanId, permissionIds, adminId);
            }

            return ResponseEntity.ok(ApiResponse.builder().success(true)
                    .message("Phân quyền tài khoản thành công").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false).message(e.getMessage()).build());
        }
    }
}
