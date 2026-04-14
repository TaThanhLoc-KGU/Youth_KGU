package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.BieuMauDTO;
import com.tathanhloc.youthkgu.Service.BieuMauService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class BieuMauController {

    private final BieuMauService service;

    // ── Public ───────────────────────────────────────────────────────────────────

    /** GET /api/public/bieu-mau — danh sách biểu mẫu active (công khai). */
    @GetMapping("/api/public/bieu-mau")
    public ResponseEntity<ApiResponse<List<BieuMauDTO>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(service.getActive()));
    }

    // ── Admin / BCH CRUD ─────────────────────────────────────────────────────────

    /** GET /api/admin/bieu-mau — tất cả biểu mẫu. */
    @GetMapping("/api/admin/bieu-mau")
    @PreAuthorize("hasAnyRole('ADMIN', 'BCH')")
    public ResponseEntity<ApiResponse<List<BieuMauDTO>>> getAll() {
        log.info("Admin get all bieu mau");
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    /** POST /api/admin/bieu-mau — tạo mới (multipart: ten, thuTu, isActive, file). */
    @PostMapping("/api/admin/bieu-mau")
    @PreAuthorize("hasAnyRole('ADMIN', 'BCH')")
    public ResponseEntity<ApiResponse<BieuMauDTO>> create(
            @RequestParam("ten") String ten,
            @RequestParam(value = "thuTu", defaultValue = "0") int thuTu,
            @RequestParam(value = "isActive", defaultValue = "true") boolean isActive,
            @RequestParam("file") MultipartFile file) {
        log.info("Admin create bieu mau: {}", ten);
        return ResponseEntity.ok(ApiResponse.success("Created", service.create(ten, thuTu, isActive, file)));
    }

    /** PUT /api/admin/bieu-mau/{id} — cập nhật tên / thứ tự / isActive (không đổi file). */
    @PutMapping("/api/admin/bieu-mau/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BCH')")
    public ResponseEntity<ApiResponse<BieuMauDTO>> updateMeta(
            @PathVariable Long id,
            @RequestParam("ten") String ten,
            @RequestParam(value = "thuTu", defaultValue = "0") int thuTu,
            @RequestParam(value = "isActive", defaultValue = "true") boolean isActive) {
        log.info("Admin update bieu mau id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Updated", service.updateMeta(id, ten, thuTu, isActive)));
    }

    /** PUT /api/admin/bieu-mau/{id}/file — thay file mới. */
    @PutMapping("/api/admin/bieu-mau/{id}/file")
    @PreAuthorize("hasAnyRole('ADMIN', 'BCH')")
    public ResponseEntity<ApiResponse<BieuMauDTO>> replaceFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        log.info("Admin replace file bieu mau id={}", id);
        return ResponseEntity.ok(ApiResponse.success("File updated", service.replaceFile(id, file)));
    }

    /** DELETE /api/admin/bieu-mau/{id} — xóa biểu mẫu + file vật lý. */
    @DeleteMapping("/api/admin/bieu-mau/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BCH')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("Admin delete bieu mau id={}", id);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }
}
