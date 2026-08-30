package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.EmailGroupDTO;
import com.tathanhloc.youthkgu.DTO.EmailGroupRequest;
import com.tathanhloc.youthkgu.Service.EmailGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Quản lý nhóm mail (mail group) dùng cho gửi email hàng loạt.
 * Cán bộ khoa chỉ thấy/quản lý nhóm của khoa mình + nhóm chung (xem EmailGroupService.getAll()).
 */
@RestController
@RequestMapping("/api/email-group")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Nhóm Mail", description = "Quản lý nhóm mail dùng cho gửi email hàng loạt")
public class EmailGroupController {

    private final EmailGroupService service;

    @GetMapping
    @Operation(summary = "Danh sách nhóm mail (theo scope khoa)")
    @PreAuthorize("hasPermission(null, 'GUI_EMAIL_HANG_LOAT')")
    public ResponseEntity<ApiResponse<List<EmailGroupDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping
    @Operation(summary = "Tạo nhóm mail mới")
    @PreAuthorize("hasPermission(null, 'GUI_EMAIL_HANG_LOAT')")
    public ResponseEntity<ApiResponse<EmailGroupDTO>> create(@RequestBody EmailGroupRequest req) {
        log.info("POST /api/email-group tenNhom={}", req.getTenNhom());
        return ResponseEntity.ok(ApiResponse.success("Đã tạo nhóm mail", service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật nhóm mail")
    @PreAuthorize("hasPermission(null, 'GUI_EMAIL_HANG_LOAT')")
    public ResponseEntity<ApiResponse<EmailGroupDTO>> update(@PathVariable Long id, @RequestBody EmailGroupRequest req) {
        log.info("PUT /api/email-group/{}", id);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật nhóm mail", service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa nhóm mail")
    @PreAuthorize("hasPermission(null, 'GUI_EMAIL_HANG_LOAT')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("DELETE /api/email-group/{}", id);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa nhóm mail", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in EmailGroupController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
