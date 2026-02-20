package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.Service.PermissionService;
import com.tathanhloc.faceattendance.payload.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api/permissions")
@RequiredArgsConstructor @Slf4j
public class PermissionController {
    private final PermissionService service;

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllGrouped() {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
            .data(service.getAllPermissionsGrouped()).build());
    }

    @GetMapping("/role/{roleName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRolePermissions(@PathVariable String roleName) {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
            .data(service.getRolePermissionIds(roleName)).build());
    }

    @PutMapping("/role/{roleName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateRolePermissions(@PathVariable String roleName,
            @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> ids = ((List<Integer>) body.get("permissionIds"))
                .stream().map(Long::valueOf).collect(Collectors.toList());
            service.updateRolePermissions(roleName, ids,
                (String) body.get("adminUsername"), (String) body.get("adminPassword"));
            return ResponseEntity.ok(ApiResponse.builder().success(true)
                .message("Cập nhật quyền nhóm thành công").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                .success(false).message(e.getMessage()).build());
        }
    }

    @GetMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAccountPermissions(@PathVariable Long taiKhoanId) {
        return ResponseEntity.ok(ApiResponse.builder().success(true)
            .data(service.getAccountPermissions(taiKhoanId)).build());
    }

    @PutMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAccountPermissions(@PathVariable Long taiKhoanId,
            @RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> grantIds = ((List<Integer>) body.getOrDefault("grantIds", List.of()))
                .stream().map(Long::valueOf).collect(Collectors.toList());
            @SuppressWarnings("unchecked")
            List<Long> revokeIds = ((List<Integer>) body.getOrDefault("revokeIds", List.of()))
                .stream().map(Long::valueOf).collect(Collectors.toList());
            service.updateAccountPermissions(taiKhoanId, grantIds, revokeIds,
                (String) body.get("ghiChu"),
                (String) body.get("adminUsername"),
                (String) body.get("adminPassword"),
                ((Number) body.get("grantedBy")).longValue());
            return ResponseEntity.ok(ApiResponse.builder().success(true)
                .message("Phân quyền tài khoản thành công").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                .success(false).message(e.getMessage()).build());
        }
    }

    @DeleteMapping("/account/{taiKhoanId}/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetAccountPermissions(@PathVariable Long taiKhoanId,
            @RequestBody Map<String, String> body) {
        try {
            service.resetAccountPermissions(taiKhoanId,
                body.get("adminUsername"), body.get("adminPassword"));
            return ResponseEntity.ok(ApiResponse.builder().success(true)
                .message("Reset quyền về mặc định nhóm thành công").build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                .success(false).message(e.getMessage()).build());
        }
    }
}
