package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.DrlMauDanhGiaDTO;
import com.tathanhloc.youthkgu.Service.DrlMauDanhGiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drl-mau-danh-gia")
@RequiredArgsConstructor
public class DrlMauDanhGiaController {

    private final DrlMauDanhGiaService service;

    // ── Danh sách ────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasPermission(null, 'XEM_THONG_KE')")
    public ResponseEntity<ApiResponse<List<DrlMauDanhGiaDTO>>> getAll(
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        List<DrlMauDanhGiaDTO> list = activeOnly ? service.getActive() : service.getAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // ── Chi tiết (kèm danh mục + tiêu chí) ───────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XEM_THONG_KE')")
    public ResponseEntity<ApiResponse<DrlMauDanhGiaDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    // ── Tạo mẫu mới từ đầu ───────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasPermission(null, 'QUAN_LY_MAU_DANH_GIA')")
    public ResponseEntity<ApiResponse<DrlMauDanhGiaDTO>> create(
            @RequestBody DrlMauDanhGiaDTO req, Authentication auth) {
        String actor = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(service.create(req, actor)));
    }

    // ── Tạo phiên bản mới (clone + sửa) ──────────────────────────────────────

    @PostMapping("/{id}/new-version")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_MAU_DANH_GIA')")
    public ResponseEntity<ApiResponse<DrlMauDanhGiaDTO>> newVersion(
            @PathVariable Long id,
            @RequestBody DrlMauDanhGiaDTO req,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(service.createNewVersion(id, req, actor)));
    }

    // ── Kích hoạt / tắt ──────────────────────────────────────────────────────

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_MAU_DANH_GIA')")
    public ResponseEntity<ApiResponse<DrlMauDanhGiaDTO>> setActive(
            @PathVariable Long id,
            @RequestParam boolean active) {
        return ResponseEntity.ok(ApiResponse.success(service.setActive(id, active)));
    }

    // ── Xóa ──────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_MAU_DANH_GIA')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
