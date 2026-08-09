package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Service.ChungNhanTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST API quản lý mẫu chứng nhận (ảnh nền + vị trí trường nội dung).
 */
@RestController
@RequestMapping("/api/chung-nhan-mau")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mẫu Chứng Nhận", description = "API quản lý mẫu thiết kế chứng nhận")
public class ChungNhanTemplateController {

    private final ChungNhanTemplateService templateService;

    @GetMapping
    @Operation(summary = "Lấy danh sách mẫu chứng nhận đang hoạt động")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY') or hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
    public ResponseEntity<ApiResponse<List<ChungNhanTemplateDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(templateService.getAllActive()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết 1 mẫu chứng nhận")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY') or hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
    public ResponseEntity<ApiResponse<ChungNhanTemplateDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(templateService.getById(id)));
    }

    @PostMapping(consumes = "multipart/form-data")
    @Operation(summary = "Tạo mẫu chứng nhận mới (ảnh nền + danh sách trường nội dung)")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<ChungNhanTemplateDTO>> create(
            @RequestPart("data") ChungNhanTemplateRequest req,
            @RequestPart("hinhNen") MultipartFile hinhNen) {
        log.info("POST /api/chung-nhan-mau - Create template: {}", req.getTen());
        ChungNhanTemplateDTO created = templateService.create(req.getTen(), hinhNen, req.getFields());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mẫu chứng nhận thành công", created));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @Operation(summary = "Cập nhật mẫu chứng nhận (đổi tên/trường nội dung, tuỳ chọn đổi ảnh nền)")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<ChungNhanTemplateDTO>> update(
            @PathVariable Long id,
            @RequestPart("data") ChungNhanTemplateRequest req,
            @RequestPart(value = "hinhNen", required = false) MultipartFile hinhNen) {
        log.info("PUT /api/chung-nhan-mau/{}", id);
        ChungNhanTemplateDTO updated = templateService.update(id, req.getTen(), hinhNen, req.getFields());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật mẫu chứng nhận thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xoá (ẩn) mẫu chứng nhận")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        templateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá mẫu chứng nhận", null));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public void rethrowAccessDenied(org.springframework.security.access.AccessDeniedException e)
            throws org.springframework.security.access.AccessDeniedException {
        throw e;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in ChungNhanTemplateController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}
