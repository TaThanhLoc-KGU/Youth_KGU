package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Service.PermissionService;
import com.tathanhloc.youthkgu.payload.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true",
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                   RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class PermissionController {

    private final PermissionService service;

    /** Lấy quyền + role info của chính mình */
    @GetMapping("/me")
    public ResponseEntity<?> getMyPermissions(Principal principal) {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getMyPermissions(principal.getName())).build());
    }

    /** Danh sách tất cả permissions nhóm theo category */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN') or hasPermission(null, 'QUAN_LY_PHAN_QUYEN_NHOM')")
    public ResponseEntity<?> getAllGrouped() {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getAllPermissionsGrouped()).build());
    }

    /** Danh sách vai trò hệ thống (cho dropdown UI) */
    @GetMapping("/roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllRoles() {
        List<Map<String, String>> roles = Arrays.stream(VaiTroEnum.values())
                .map(r -> Map.of("value", r.name(), "label", r.getLabel()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.builder().success(true).data(roles).build());
    }

    /** Bộ quyền mặc định của từng role (dùng để UI preview) */
    @GetMapping("/role-defaults")
    @PreAuthorize("hasRole('ADMIN') or hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN') or hasPermission(null, 'QUAN_LY_PHAN_QUYEN_NHOM')")
    public ResponseEntity<?> getRoleDefaults() {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getRoleDefaultPermissions()).build());
    }

    /** Cập nhật bộ quyền mặc định của một role */
    @PutMapping("/role-defaults/{vaiTro}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setRoleDefaults(@PathVariable String vaiTro,
            @RequestBody Map<String, Object> body, Principal principal) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> ids = ((List<Integer>) body.getOrDefault("permissionIds", List.of()))
                    .stream().map(Long::valueOf).collect(Collectors.toList());
            service.setRoleDefaultPermissions(vaiTro, ids, null);
            return ResponseEntity.ok(ApiResponse.builder().success(true)
                    .message("Cập nhật quyền mặc định cho role " + vaiTro + " thành công").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false).message(e.getMessage()).build());
        }
    }

    /** Lấy quyền của một tài khoản cụ thể (bao gồm role defaults + overrides) */
    @GetMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasRole('ADMIN') or hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<?> getAccountPermissions(@PathVariable Long taiKhoanId) {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getAccountPermissions(taiKhoanId)).build());
    }

    /**
     * Gán quyền tùy chỉnh cho tài khoản (override trên bộ mặc định của role).
     * Body: { "permissionIds": [1, 2, 3] }
     */
    @PutMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasRole('ADMIN') or hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<?> setAccountPermissions(@PathVariable Long taiKhoanId,
            @RequestBody Map<String, Object> body, Principal principal) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> ids = ((List<Integer>) body.getOrDefault("permissionIds", List.of()))
                    .stream().map(Long::valueOf).collect(Collectors.toList());
            service.setAccountPermissions(taiKhoanId, ids, null);
            return ResponseEntity.ok(ApiResponse.builder().success(true)
                    .message("Cập nhật quyền tùy chỉnh thành công").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false).message(e.getMessage()).build());
        }
    }
}
