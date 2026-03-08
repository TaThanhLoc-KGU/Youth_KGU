package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.AdBannerDTO;
import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.Service.AdBannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AdBanner", description = "API quản lý banner & widget quảng cáo trang news")
public class AdBannerController {

    private final AdBannerService service;

    // ── Public (không cần đăng nhập) ────────────────────────────────────────────

    @GetMapping("/api/public/ad-banners")
    @Operation(summary = "Lấy tất cả banner đang active (public)")
    public ResponseEntity<ApiResponse<List<AdBannerDTO>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(service.getActive()));
    }

    @GetMapping("/api/public/ad-banners/loai/{loai}")
    @Operation(summary = "Lấy banner active theo loại: MAIN hoặc SIDEBAR (public)")
    public ResponseEntity<ApiResponse<List<AdBannerDTO>>> getActiveByLoai(@PathVariable String loai) {
        return ResponseEntity.ok(ApiResponse.success(service.getActiveByLoai(loai.toUpperCase())));
    }

    // ── Admin ────────────────────────────────────────────────────────────────────

    @GetMapping("/api/ad-banners")
    @Operation(summary = "Lấy tất cả banner (admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdBannerDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping("/api/ad-banners")
    @Operation(summary = "Tạo banner mới")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdBannerDTO>> create(@RequestBody AdBannerDTO dto) {
        log.info("POST /api/ad-banners - tieuDe={}, loai={}", dto.getTieuDe(), dto.getLoai());
        return ResponseEntity.ok(ApiResponse.success(service.create(dto)));
    }

    @PutMapping("/api/ad-banners/{id}")
    @Operation(summary = "Cập nhật banner")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdBannerDTO>> update(
            @PathVariable Long id, @RequestBody AdBannerDTO dto) {
        log.info("PUT /api/ad-banners/{}", id);
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto)));
    }

    @DeleteMapping("/api/ad-banners/{id}")
    @Operation(summary = "Xóa banner")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("DELETE /api/ad-banners/{}", id);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/api/ad-banners/reorder")
    @Operation(summary = "Sắp xếp lại thứ tự banner")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> reorder(@RequestBody List<Long> ids) {
        log.info("PUT /api/ad-banners/reorder - {} items", ids.size());
        service.reorder(ids);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
