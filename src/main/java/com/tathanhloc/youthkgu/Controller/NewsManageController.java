package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Service.ChuyenMucService;
import com.tathanhloc.youthkgu.Service.TinTucService;
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

import java.util.List;

/**
 * API quản lý bài viết tin tức và danh mục — yêu cầu JWT + permission.
 *
 * Permissions sử dụng:
 *   DANG_TIN_TUC      — tạo và xem bài của đơn vị mình
 *   SUA_TIN_TUC       — sửa, archive bài
 *   XOA_TIN_TUC       — xóa mềm bài
 *   DUYET_TIN_TUC     — publish/duyệt bài trước khi công bố
 *   QUAN_LY_CHUYEN_MUC — thêm/sửa/xóa danh mục
 */
@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@Slf4j
public class NewsManageController {

    private final TinTucService tinTucService;
    private final VanBanService vanBanService;
    private final ChuyenMucService chuyenMucService;
    private final com.tathanhloc.youthkgu.Service.FileStorageService fileStorageService;

    // ── Tin Tức CRUD ──────────────────────────────────────────────────────────

    /**
     * POST /api/news/upload-image
     * Upload ảnh chung (avatar bài viết hoặc chèn vào editor).
     * Trả về { "url": "..." }
     */
    @PostMapping("/upload-image")
    @PreAuthorize("hasPermission(null, 'DANG_TIN_TUC')")
    public ResponseEntity<java.util.Map<String, String>> uploadGeneralImage(
            @RequestParam("file") MultipartFile file) {
        log.info("Upload general news image: {}", file.getOriginalFilename());
        String url = fileStorageService.saveNewsImage(file);
        return ResponseEntity.ok(java.util.Map.of("url", url));
    }

    /**
     * GET /api/news/images
     * Liệt kê tất cả ảnh đã upload vào uploads/tin-tuc/ để chọn từ server.
     */
    @GetMapping("/images")
    @PreAuthorize("hasPermission(null, 'DANG_TIN_TUC')")
    public ResponseEntity<java.util.List<String>> listNewsImages() {
        return ResponseEntity.ok(fileStorageService.listNewsImages());
    }

    /**
     * POST /api/news
     * Tạo bài viết mới ở trạng thái DRAFT.
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'DANG_TIN_TUC')")
    public ResponseEntity<TinTucDTO> create(
            @RequestBody TinTucDTO dto,
            Authentication auth) {
        log.info("Create TinTuc by {}", auth.getName());
        return ResponseEntity.ok(tinTucService.create(dto, auth.getName()));
    }

    /**
     * GET /api/news?page=0&size=10&keyword=abc&trangThai=PUBLISHED
     * Danh sách bài viết — tất cả BCH/Admin đều thấy toàn bộ bài,
     * hỗ trợ filter keyword và trangThai.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'DANG_TIN_TUC')")
    public ResponseEntity<Page<TinTucDTO>> getDanhSach(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String trangThai,
            Authentication auth) {
        log.info("Get news list for user={} keyword={} trangThai={}", auth.getName(), keyword, trangThai);
        // Tất cả người có quyền DANG_TIN_TUC đều thấy toàn bộ bài
        // (BCH muốn cộng tác, review bài của các ban khác)
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(tinTucService.getDanhSach(keyword, trangThai, pageable));
    }

    /**
     * GET /api/news/{id}
     * Chi tiết bài viết (kèm breadcrumb, ảnh, văn bản đính kèm, thông tin hoạt động).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'DANG_TIN_TUC')")
    public ResponseEntity<TinTucDetailDTO> getById(@PathVariable Long id) {
        log.info("Get TinTuc detail id={}", id);
        return ResponseEntity.ok(tinTucService.getById(id));
    }

    /**
     * PUT /api/news/{id}
     * Sửa bài viết (chỉ khi chưa PUBLISHED hoặc có quyền SUA_TIN_TUC).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'SUA_TIN_TUC')")
    public ResponseEntity<TinTucDTO> update(
            @PathVariable Long id,
            @RequestBody TinTucDTO dto,
            Authentication auth) {
        log.info("Update TinTuc id={} by {}", id, auth.getName());
        return ResponseEntity.ok(tinTucService.update(id, dto, auth.getName()));
    }

    /**
     * DELETE /api/news/{id}
     * Xóa mềm bài viết (is_deleted = true).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XOA_TIN_TUC')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Delete TinTuc id={}", id);
        tinTucService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Publish / Archive ─────────────────────────────────────────────────────

    /**
     * POST /api/news/{id}/publish
     * Duyệt và publish bài — TT-002: tự động set ngayXuatBan = NOW().
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasPermission(null, 'DUYET_TIN_TUC')")
    public ResponseEntity<TinTucDTO> publish(@PathVariable Long id) {
        log.info("Publish TinTuc id={}", id);
        return ResponseEntity.ok(tinTucService.publish(id));
    }

    /**
     * POST /api/news/{id}/archive
     * Archive bài (ẩn khỏi public, giữ lại dữ liệu).
     */
    @PostMapping("/{id}/archive")
    @PreAuthorize("hasPermission(null, 'SUA_TIN_TUC')")
    public ResponseEntity<TinTucDTO> archive(@PathVariable Long id) {
        log.info("Archive TinTuc id={}", id);
        return ResponseEntity.ok(tinTucService.archive(id));
    }

    // ── Upload Ảnh ────────────────────────────────────────────────────────────

    /**
     * POST /api/news/{id}/upload-image
     * Upload ảnh đính kèm cho bài viết (multipart/form-data).
     */
    @PostMapping("/{id}/upload-image")
    @PreAuthorize("hasPermission(null, 'DANG_TIN_TUC')")
    public ResponseEntity<TinTucAnhDTO> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        log.info("Upload image for TinTuc id={} by {}", id, auth.getName());
        return ResponseEntity.ok(tinTucService.uploadAnh(id, file, auth.getName()));
    }

    // ── Văn Bản Autocomplete ──────────────────────────────────────────────────

    /**
     * GET /api/news/van-ban/search?keyword=
     * Tìm kiếm văn bản để đính kèm vào bài viết (autocomplete).
     * Chỉ trả về văn bản PUBLISHED.
     */
    @GetMapping("/van-ban/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<VanBanSearchResultDTO>> searchVanBan(
            @RequestParam String keyword) {
        log.info("Search van ban autocomplete - keyword={}", keyword);
        return ResponseEntity.ok(vanBanService.search(keyword));
    }

    // ── Chuyên Mục ────────────────────────────────────────────────────────────

    /**
     * GET /api/news/chuyen-muc
     * Danh sách tất cả chuyên mục (flat list có level/indent) cho dropdown.
     */
    @GetMapping("/chuyen-muc")
    @PreAuthorize("hasPermission(null, 'DANG_TIN_TUC')")
    public ResponseEntity<List<ChuyenMucDTO>> getDanhSachChuyenMuc() {
        log.info("Get all chuyen muc (flat)");
        return ResponseEntity.ok(chuyenMucService.getAll());
    }

    /**
     * POST /api/news/chuyen-muc
     * Tạo danh mục mới.
     */
    @PostMapping("/chuyen-muc")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CHUYEN_MUC')")
    public ResponseEntity<ChuyenMucDTO> createChuyenMuc(@RequestBody ChuyenMucDTO dto) {
        log.info("Create ChuyenMuc: {}", dto.getTen());
        return ResponseEntity.ok(chuyenMucService.create(dto));
    }

    /**
     * PUT /api/news/chuyen-muc/{id}
     * Sửa danh mục — CM-001: cascade recalculate slug + url_redirect toàn subtree.
     */
    @PutMapping("/chuyen-muc/{id}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CHUYEN_MUC')")
    public ResponseEntity<ChuyenMucDTO> updateChuyenMuc(
            @PathVariable Long id,
            @RequestBody ChuyenMucDTO dto) {
        log.info("Update ChuyenMuc id={}", id);
        return ResponseEntity.ok(chuyenMucService.update(id, dto));
    }

    /**
     * DELETE /api/news/chuyen-muc/{id}
     * Xóa mềm danh mục — CM-002: không xóa khi còn tin_tuc / van_ban / danh mục con.
     */
    @DeleteMapping("/chuyen-muc/{id}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CHUYEN_MUC')")
    public ResponseEntity<Void> deleteChuyenMuc(@PathVariable Long id) {
        log.info("Delete ChuyenMuc id={}", id);
        chuyenMucService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
