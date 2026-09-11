package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.SystemSettingDTO;
import com.tathanhloc.youthkgu.DTO.SystemSettingUpdateRequest;
import com.tathanhloc.youthkgu.Service.SystemSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Cấu hình / feature-flag chung của hệ thống.
 * GET / và PUT /{key} cần quyền CAI_DAT_HE_THONG; GET /public mở cho mọi request
 * (frontend đọc trước khi đăng nhập — vd chế độ bảo trì, bật/tắt bình luận).
 */
@RestController
@RequestMapping("/api/system-settings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cài đặt hệ thống", description = "Bật/tắt tính năng, chế độ bảo trì...")
public class SystemSettingController {

    private final SystemSettingService service;

    @GetMapping
    @Operation(summary = "Toàn bộ cài đặt, gom theo nhóm")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Map<String, List<SystemSettingDTO>>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllGrouped()));
    }

    @PutMapping("/{key}")
    @Operation(summary = "Cập nhật 1 cài đặt")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<SystemSettingDTO>> update(
            @PathVariable String key,
            @RequestBody SystemSettingUpdateRequest req,
            Authentication auth) {
        log.info("PUT /api/system-settings/{} = {} by {}", key, req.giaTri(), auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã lưu", service.set(key, req.giaTri(), auth.getName())));
    }

    @GetMapping("/public")
    @Operation(summary = "Các cài đặt công khai (không cần đăng nhập)")
    public ResponseEntity<ApiResponse<List<SystemSettingDTO>>> getPublic() {
        return ResponseEntity.ok(ApiResponse.success(service.getPublic()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in SystemSettingController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
