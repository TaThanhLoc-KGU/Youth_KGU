package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.EmailTemplateDTO;
import com.tathanhloc.youthkgu.DTO.EmailTemplateRequest;
import com.tathanhloc.youthkgu.Service.EmailTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Quản lý mẫu email hàng loạt đặt tên, tái sử dụng được. */
@RestController
@RequestMapping("/api/email-template")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mẫu Email", description = "Quản lý mẫu email dùng cho gửi email hàng loạt")
public class EmailTemplateController {

    private final EmailTemplateService service;

    @GetMapping
    @Operation(summary = "Danh sách mẫu email")
    @PreAuthorize("hasPermission(null, 'GUI_EMAIL_HANG_LOAT')")
    public ResponseEntity<ApiResponse<List<EmailTemplateDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping
    @Operation(summary = "Lưu mẫu email mới")
    @PreAuthorize("hasPermission(null, 'GUI_EMAIL_HANG_LOAT')")
    public ResponseEntity<ApiResponse<EmailTemplateDTO>> create(@RequestBody EmailTemplateRequest req, Authentication auth) {
        log.info("POST /api/email-template tenMau={} by {}", req.getTenMau(), auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã lưu mẫu email", service.create(req, auth.getName())));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật mẫu email")
    @PreAuthorize("hasPermission(null, 'GUI_EMAIL_HANG_LOAT')")
    public ResponseEntity<ApiResponse<EmailTemplateDTO>> update(@PathVariable Long id, @RequestBody EmailTemplateRequest req, Authentication auth) {
        log.info("PUT /api/email-template/{} by {}", id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật mẫu email", service.update(id, req, auth.getName())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mẫu email")
    @PreAuthorize("hasPermission(null, 'GUI_EMAIL_HANG_LOAT')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("DELETE /api/email-template/{}", id);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa mẫu email", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in EmailTemplateController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
