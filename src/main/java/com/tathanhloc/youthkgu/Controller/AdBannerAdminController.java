package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.AdBannerDTO;
import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.Service.AdBannerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ad-banners")
@RequiredArgsConstructor
@Slf4j
public class AdBannerAdminController {

    private final AdBannerService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdBannerDTO>>> getAll() {
        log.info("Admin get all ad banners");
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdBannerDTO>> create(@RequestBody AdBannerDTO dto) {
        log.info("Admin create ad banner");
        return ResponseEntity.ok(ApiResponse.success("Created", service.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdBannerDTO>> update(@PathVariable Long id, @RequestBody AdBannerDTO dto) {
        log.info("Admin update ad banner id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Updated", service.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("Admin delete ad banner id={}", id);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> reorder(@RequestBody List<Long> ids) {
        log.info("Admin reorder ad banners");
        service.reorder(ids);
        return ResponseEntity.ok(ApiResponse.success("Reordered", null));
    }

    /**
     * Kích hoạt duy nhất một banner trong cùng loại (tắt tất cả cùng loại rồi bật cái này).
     * PUT /api/ad-banners/{id}/activate
     */
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdBannerDTO>> activate(@PathVariable Long id) {
        log.info("Admin activate ad banner id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Activated", service.activate(id)));
    }

    /**
     * Tắt hiển thị một banner (không banner nào active sau lệnh này).
     * PUT /api/ad-banners/{id}/deactivate
     */
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdBannerDTO>> deactivate(@PathVariable Long id) {
        log.info("Admin deactivate ad banner id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Deactivated", service.deactivate(id)));
    }
}
