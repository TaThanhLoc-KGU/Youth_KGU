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

    /** Lấy quyền của chính mình — mọi người dùng đã đăng nhập đều gọi được. */
    @GetMapping("/me")
    public ResponseEntity<?> getMyPermissions(Principal principal) {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getMyPermissions(principal.getName())).build());
    }

    /** Lấy tất cả permissions nhóm theo category. */
    @GetMapping("/all")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_NHOM') or hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<?> getAllGrouped() {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getAllPermissionsGrouped()).build());
    }

    /** Lấy permission IDs của một role bất kỳ (ADMIN, SINH_VIEN, BCH_LEVEL_1, ...). */
    @GetMapping("/role/{roleName}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_NHOM')")
    public ResponseEntity<?> getRolePermissions(@PathVariable String roleName) {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getRolePermissionIds(roleName)).build());
    }

    /**
     * Cập nhật permissions cho một role.
     * Body: { "permissionIds": [1, 2, 3, ...] }
     * Không yêu cầu admin password — bảo vệ bởi @PreAuthorize.
     */
    @PutMapping("/role/{roleName}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_NHOM')")
    public ResponseEntity<?> updateRolePermissions(@PathVariable String roleName,
            @RequestBody Map<String, Object> body, Principal principal) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> ids = ((List<Integer>) body.get("permissionIds"))
                    .stream().map(Long::valueOf).collect(Collectors.toList());
            service.updateRolePermissions(roleName, ids, principal.getName());
            return ResponseEntity.ok(ApiResponse.builder().success(true)
                    .message("Cập nhật quyền nhóm thành công").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false).message(e.getMessage()).build());
        }
    }

    // ─── BCH Level Matrix ─────────────────────────────────────────────────────

    /**
     * Lấy permission matrix cho cả 4 BCH levels + danh sách tất cả permissions.
     * Response: { matrix: {BCH_LEVEL_1: [...ids], BCH_LEVEL_2: [...], BCH_LEVEL_3: [...], BCH_LEVEL_4: [...]},
     *             permissions: {HOAT_DONG: [{id, name, description}, ...], ...} }
     */
    @GetMapping("/matrix")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_NHOM')")
    public ResponseEntity<?> getBchLevelMatrix() {
        Map<String, Object> data = Map.of(
                "matrix", service.getBchLevelMatrix(),
                "permissions", service.getAllPermissionsGrouped()
        );
        return ResponseEntity.ok(ApiResponse.builder().success(true).data(data).build());
    }

    /**
     * Cập nhật permissions cho một BCH level (1, 2 hoặc 3).
     * Body: { "permissionIds": [1, 2, 3, ...] }
     */
    @PutMapping("/level/{level}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_NHOM')")
    public ResponseEntity<?> updateLevelPermissions(@PathVariable int level,
            @RequestBody Map<String, Object> body, Principal principal) {
        if (level < 1 || level > 4) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false).message("Level phải là 1, 2, 3 hoặc 4").build());
        }
        try {
            @SuppressWarnings("unchecked")
            List<Long> ids = ((List<Integer>) body.get("permissionIds"))
                    .stream().map(Long::valueOf).collect(Collectors.toList());
            service.updateRolePermissions("BCH_LEVEL_" + level, ids, principal.getName());
            return ResponseEntity.ok(ApiResponse.builder().success(true)
                    .message("Cập nhật quyền BCH Level " + level + " thành công. "
                            + "Người dùng cần đăng nhập lại để áp dụng thay đổi.").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false).message(e.getMessage()).build());
        }
    }

    // ─── Account-level permissions ────────────────────────────────────────────

    @GetMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<?> getAccountPermissions(@PathVariable Long taiKhoanId) {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .data(service.getAccountPermissions(taiKhoanId)).build());
    }

    /**
     * Cấp / thu hồi quyền cho tài khoản cụ thể.
     * Body: { "grantIds": [...], "revokeIds": [...], "ghiChu": "..." }
     */
    @PutMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<?> updateAccountPermissions(@PathVariable Long taiKhoanId,
            @RequestBody Map<String, Object> body, Principal principal) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> grantIds = ((List<Integer>) body.getOrDefault("grantIds", List.of()))
                    .stream().map(Long::valueOf).collect(Collectors.toList());
            @SuppressWarnings("unchecked")
            List<Long> revokeIds = ((List<Integer>) body.getOrDefault("revokeIds", List.of()))
                .stream().map(Long::valueOf).collect(Collectors.toList());
            Number grantedByNum = (Number) body.get("grantedBy");
            Long grantedBy = grantedByNum != null ? grantedByNum.longValue() : null;
            service.updateAccountPermissions(taiKhoanId, grantIds, revokeIds,
                (String) body.get("ghiChu"),
                (String) body.get("adminUsername"),
                (String) body.get("adminPassword"),
                grantedBy);
            return ResponseEntity.ok(ApiResponse.builder().success(true)
                    .message("Phân quyền tài khoản thành công").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false).message(e.getMessage()).build());
        }
    }

    /** Xóa toàn bộ override cá nhân của tài khoản. */
    @DeleteMapping("/account/{taiKhoanId}/reset")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<?> resetAccountPermissions(@PathVariable Long taiKhoanId) {
        try {
            service.resetAccountPermissions(taiKhoanId);
            return ResponseEntity.ok(ApiResponse.builder().success(true)
                    .message("Reset quyền về mặc định nhóm thành công").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false).message(e.getMessage()).build());
        }
    }
}
