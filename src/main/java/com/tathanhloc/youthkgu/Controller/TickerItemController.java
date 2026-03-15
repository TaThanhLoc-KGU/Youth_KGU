package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.TickerItemDTO;
import com.tathanhloc.youthkgu.Service.TickerItemService;
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
@Tag(name = "Ticker", description = "API quản lý nội dung tin chạy chữ trang news")
public class TickerItemController {

    private final TickerItemService service;

    // ── Public (không cần đăng nhập) ────────────────────────────────────────────

    @GetMapping("/api/public/ticker")
    @Operation(summary = "Lấy danh sách ticker đang active (public)")
    public ResponseEntity<ApiResponse<List<TickerItemDTO>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(service.getActive()));
    }

    // ── Admin ────────────────────────────────────────────────────────────────────

    @GetMapping("/api/ticker-items")
    @Operation(summary = "Lấy tất cả ticker (admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TickerItemDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping("/api/ticker-items")
    @Operation(summary = "Tạo ticker item mới")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TickerItemDTO>> create(@RequestBody TickerItemDTO dto) {
        log.info("POST /api/ticker-items - noiDung={}", dto.getNoiDung());
        return ResponseEntity.ok(ApiResponse.success(service.create(dto)));
    }

    @PutMapping("/api/ticker-items/{id}")
    @Operation(summary = "Cập nhật ticker item")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TickerItemDTO>> update(
            @PathVariable Long id, @RequestBody TickerItemDTO dto) {
        log.info("PUT /api/ticker-items/{}", id);
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto)));
    }

    @DeleteMapping("/api/ticker-items/{id}")
    @Operation(summary = "Xóa ticker item")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("DELETE /api/ticker-items/{}", id);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/api/ticker-items/reorder")
    @Operation(summary = "Sắp xếp lại thứ tự ticker")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> reorder(@RequestBody List<Long> ids) {
        log.info("PUT /api/ticker-items/reorder - {} items", ids.size());
        service.reorder(ids);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
