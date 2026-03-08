package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.SliderItemDTO;
import com.tathanhloc.youthkgu.Service.SliderItemService;
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
@Tag(name = "Slider", description = "API quản lý nội dung hero slider trang news")
public class SliderItemController {

    private final SliderItemService service;

    // ── Public (không cần đăng nhập) ────────────────────────────────────────────

    @GetMapping("/api/public/slider")
    @Operation(summary = "Lấy danh sách slider đang active (public)")
    public ResponseEntity<ApiResponse<List<SliderItemDTO>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(service.getActive()));
    }

    // ── Admin ────────────────────────────────────────────────────────────────────

    @GetMapping("/api/slider-items")
    @Operation(summary = "Lấy tất cả slider (admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SliderItemDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping("/api/slider-items")
    @Operation(summary = "Tạo slider item mới")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SliderItemDTO>> create(@RequestBody SliderItemDTO dto) {
        log.info("POST /api/slider-items - tieuDe={}", dto.getTieuDe());
        return ResponseEntity.ok(ApiResponse.success(service.create(dto)));
    }

    @PutMapping("/api/slider-items/{id}")
    @Operation(summary = "Cập nhật slider item")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SliderItemDTO>> update(
            @PathVariable Long id, @RequestBody SliderItemDTO dto) {
        log.info("PUT /api/slider-items/{}", id);
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto)));
    }

    @DeleteMapping("/api/slider-items/{id}")
    @Operation(summary = "Xóa slider item")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("DELETE /api/slider-items/{}", id);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/api/slider-items/reorder")
    @Operation(summary = "Sắp xếp lại thứ tự slider")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> reorder(@RequestBody List<Long> ids) {
        log.info("PUT /api/slider-items/reorder - {} items", ids.size());
        service.reorder(ids);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
