package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.TnDeThiCreateRequest;
import com.tathanhloc.youthkgu.DTO.TnDeThiDTO;
import com.tathanhloc.youthkgu.Service.KhoaScopeService;
import com.tathanhloc.youthkgu.Service.TnDeThiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Quản lý đề thi trắc nghiệm (Admin/cán bộ). */
@RestController
@RequestMapping("/api/tn/de-thi")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "TN — Đề thi")
@PreAuthorize("hasPermission(null, 'THI_TN_QUAN_LY_DE_THI')")
public class TnDeThiController {

    private final TnDeThiService service;
    private final KhoaScopeService khoaScopeService;

    @GetMapping
    @Operation(summary = "Danh sách đề thi (tự scope theo khoa)")
    public ResponseEntity<ApiResponse<Page<TnDeThiDTO>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String maKhoa = khoaScopeService.getCurrentMaKhoa();  // null = Đoàn trường → xem tất cả
        return ResponseEntity.ok(ApiResponse.success(service.list(maKhoa, PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết đề thi (kèm câu hỏi cố định / ma trận)")
    public ResponseEntity<ApiResponse<TnDeThiDTO>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getDetail(id)));
    }

    @PostMapping
    @Operation(summary = "Tạo đề thi — xử lý cả 2 chế độ CO_DINH / NGAU_NHIEN")
    public ResponseEntity<ApiResponse<TnDeThiDTO>> create(
            @RequestBody TnDeThiCreateRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Đã tạo đề thi", service.create(req, auth.getName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TnDeThiDTO>> update(
            @PathVariable Long id, @RequestBody TnDeThiCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật đề thi", service.update(id, req)));
    }

    @PatchMapping("/{id}/trang-thai")
    @Operation(summary = "Xuất bản / đóng đề  (body: {\"trangThai\":\"DA_XUAT_BAN\"})")
    public ResponseEntity<ApiResponse<TnDeThiDTO>> doiTrangThai(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(service.doiTrangThai(id, body.get("trangThai"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá đề thi", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handle(Exception e) {
        log.warn("TnDeThiController: {}", e.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), 400));
    }
}
