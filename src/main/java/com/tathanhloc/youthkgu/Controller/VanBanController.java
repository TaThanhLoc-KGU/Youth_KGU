package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.VanBanDTO;
import com.tathanhloc.youthkgu.Service.VanBanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * API quản lý kho văn bản / kế hoạch — yêu cầu JWT + permission.
 *
 * Business rules:
 *   VB-001: PUBLISHED → bất biến (không sửa, không thay file).
 *   VB-002: Mỗi VanBan chỉ có đúng 1 bản ghi trong van_ban_file.
 *
 * Permissions sử dụng:
 *   QUAN_LY_VAN_BAN — tạo/sửa/xem/publish/thay file
 *   XOA_VAN_BAN     — xóa mềm văn bản
 */
@RestController
@RequestMapping("/api/van-ban")
@RequiredArgsConstructor
@Slf4j
public class VanBanController {

    private final VanBanService vanBanService;

    /**
     * POST /api/van-ban (multipart/form-data)
     * Tạo văn bản mới + upload file (file có thể không có ngay lúc tạo).
     *
     * Request parts:
     *   - data  (application/json) : VanBanDTO
     *   - file  (binary, optional) : file PDF/Word/Excel/PPT
     */
    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_VAN_BAN')")
    public ResponseEntity<VanBanDTO> create(
            @RequestPart("data") VanBanDTO dto,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Authentication auth) {
        log.info("Create VanBan by {}", auth.getName());
        return ResponseEntity.ok(vanBanService.create(dto, file, auth.getName()));
    }

    /**
     * GET /api/van-ban?page=0&size=10
     * Danh sách tất cả văn bản (kể cả DRAFT) cho trang quản lý.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'QUAN_LY_VAN_BAN')")
    public ResponseEntity<Page<VanBanDTO>> getDanhSach(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Get van-ban management list - page={}", page);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(vanBanService.getDanhSach(pageable));
    }

    /**
     * GET /api/van-ban/{id}
     * Chi tiết văn bản kèm thông tin file.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_VAN_BAN')")
    public ResponseEntity<VanBanDTO> getById(@PathVariable Long id) {
        log.info("Get VanBan detail id={}", id);
        return ResponseEntity.ok(vanBanService.getById(id));
    }

    /**
     * PUT /api/van-ban/{id}
     * Sửa metadata văn bản.
     * VB-001: Ném BusinessException nếu trangThai = PUBLISHED.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_VAN_BAN')")
    public ResponseEntity<VanBanDTO> update(
            @PathVariable Long id,
            @RequestBody VanBanDTO dto) {
        log.info("Update VanBan id={}", id);
        return ResponseEntity.ok(vanBanService.update(id, dto));
    }

    /**
     * DELETE /api/van-ban/{id}
     * Xóa mềm văn bản (is_deleted = true).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XOA_VAN_BAN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Delete VanBan id={}", id);
        vanBanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/van-ban/{id}/publish
     * Ban hành văn bản chính thức.
     * VB-001: Sau khi PUBLISHED, văn bản trở nên bất biến.
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_VAN_BAN')")
    public ResponseEntity<VanBanDTO> publish(@PathVariable Long id) {
        log.info("Publish VanBan id={}", id);
        return ResponseEntity.ok(vanBanService.publish(id));
    }

    /**
     * PUT /api/van-ban/{id}/file (multipart/form-data)
     * Thay thế file đính kèm.
     * VB-001: Không cho thay file khi đã PUBLISHED.
     * VB-002: Xóa file cũ trước khi lưu file mới (1 văn bản = 1 file).
     */
    @PutMapping(value = "/{id}/file", consumes = "multipart/form-data")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_VAN_BAN')")
    public ResponseEntity<Void> uploadFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        log.info("Replace file for VanBan id={} by {}", id, auth.getName());
        vanBanService.uploadFile(id, file, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
