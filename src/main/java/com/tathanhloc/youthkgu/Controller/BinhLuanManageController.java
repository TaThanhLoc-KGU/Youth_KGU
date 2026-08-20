package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.BinhLuanAdminDTO;
import com.tathanhloc.youthkgu.Service.TinTucBinhLuanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Kiểm duyệt bình luận eNews — yêu cầu quyền KIEM_DUYET_BINH_LUAN.
 * Khóa bình luận (khoá cả bài) / chặn (ẩn 1 bình luận, còn lưu) / xóa (xóa mềm 1 bình luận).
 */
@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Kiểm Duyệt Bình Luận", description = "API khóa/chặn/xóa bình luận eNews")
public class BinhLuanManageController {

    private final TinTucBinhLuanService binhLuanService;

    @GetMapping("/{id}/binh-luan")
    @Operation(summary = "Toàn bộ bình luận của 1 bài (kể cả đã chặn/xóa) — dùng cho màn kiểm duyệt")
    @PreAuthorize("hasPermission(null, 'KIEM_DUYET_BINH_LUAN')")
    public ResponseEntity<ApiResponse<Page<BinhLuanAdminDTO>>> getAll(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(binhLuanService.getAllForAdmin(id, pageable)));
    }

    @PatchMapping("/binh-luan/{commentId}/chan")
    @Operation(summary = "Chặn 1 bình luận (ẩn khỏi public, còn lưu để đối chiếu)")
    @PreAuthorize("hasPermission(null, 'KIEM_DUYET_BINH_LUAN')")
    public ResponseEntity<ApiResponse<Void>> chan(
            @PathVariable Long commentId, Authentication authentication) {
        log.info("PATCH /api/news/binh-luan/{}/chan by {}", commentId, authentication.getName());
        binhLuanService.chan(commentId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã chặn bình luận", null));
    }

    @PatchMapping("/binh-luan/{commentId}/bo-chan")
    @Operation(summary = "Bỏ chặn 1 bình luận")
    @PreAuthorize("hasPermission(null, 'KIEM_DUYET_BINH_LUAN')")
    public ResponseEntity<ApiResponse<Void>> boChan(
            @PathVariable Long commentId, Authentication authentication) {
        log.info("PATCH /api/news/binh-luan/{}/bo-chan by {}", commentId, authentication.getName());
        binhLuanService.boChan(commentId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã bỏ chặn bình luận", null));
    }

    @DeleteMapping("/binh-luan/{commentId}")
    @Operation(summary = "Xóa mềm 1 bình luận")
    @PreAuthorize("hasPermission(null, 'KIEM_DUYET_BINH_LUAN')")
    public ResponseEntity<ApiResponse<Void>> xoa(
            @PathVariable Long commentId, Authentication authentication) {
        log.info("DELETE /api/news/binh-luan/{} by {}", commentId, authentication.getName());
        binhLuanService.xoa(commentId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã xóa bình luận", null));
    }

    @PatchMapping("/{id}/khoa-binh-luan")
    @Operation(summary = "Khóa/mở khóa bình luận cho 1 bài viết")
    @PreAuthorize("hasPermission(null, 'KIEM_DUYET_BINH_LUAN')")
    public ResponseEntity<ApiResponse<Void>> khoaBinhLuan(
            @PathVariable Long id,
            @RequestParam boolean khoa,
            Authentication authentication) {
        log.info("PATCH /api/news/{}/khoa-binh-luan?khoa={} by {}", id, khoa, authentication.getName());
        binhLuanService.toggleKhoaBinhLuan(id, khoa, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(khoa ? "Đã khóa bình luận" : "Đã mở khóa bình luận", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in BinhLuanManageController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
