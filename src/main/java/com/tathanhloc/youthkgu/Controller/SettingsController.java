package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.AccountPermissionDTO;
import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.PermissionDTO;
import com.tathanhloc.youthkgu.Service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cài đặt", description = "API quản lý phân quyền tài khoản")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/permissions")
    @Operation(summary = "Lấy tất cả quyền theo nhóm category")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Map<String, List<PermissionDTO>>>> getAllPermissions() {
        log.info("GET /api/settings/permissions");
        Map<String, List<PermissionDTO>> result = settingsService.getAllPermissions();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/permissions/accounts")
    @Operation(summary = "Lấy danh sách tài khoản quản lý")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<List<AccountPermissionDTO>>> getManagementAccounts() {
        log.info("GET /api/settings/permissions/accounts");
        List<AccountPermissionDTO> accounts = settingsService.getManagementAccounts();
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @GetMapping("/permissions/accounts/{id}")
    @Operation(summary = "Lấy danh sách quyền của 1 tài khoản")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<List<Long>>> getAccountPermissions(@PathVariable Long id) {
        log.info("GET /api/settings/permissions/accounts/{}", id);
        List<Long> permissionIds = settingsService.getAccountPermissions(id);
        return ResponseEntity.ok(ApiResponse.success(permissionIds));
    }

    @PutMapping("/permissions/accounts/{id}")
    @Operation(summary = "Gán quyền cho tài khoản")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<Void>> assignPermissions(
            @PathVariable Long id,
            @RequestBody List<Long> permissionIds) {
        log.info("PUT /api/settings/permissions/accounts/{} - {} permissions", id, permissionIds != null ? permissionIds.size() : 0);
        settingsService.assignPermissions(id, permissionIds);
        return ResponseEntity.ok(ApiResponse.success("Phân quyền thành công", null));
    }

    @PostMapping("/permissions/init")
    @Operation(summary = "Khởi tạo dữ liệu quyền mặc định")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Integer>> initPermissions() {
        log.info("POST /api/settings/permissions/init");
        int count = settingsService.initDefaultPermissions();
        String message = count > 0 ? "Đã khởi tạo " + count + " quyền" : "Dữ liệu quyền đã tồn tại";
        return ResponseEntity.ok(ApiResponse.success(message, count));
    }
}
