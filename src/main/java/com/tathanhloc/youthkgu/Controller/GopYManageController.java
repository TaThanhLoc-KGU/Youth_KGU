package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.GopYAdminDTO;
import com.tathanhloc.youthkgu.DTO.GopYPhanHoiRequest;
import com.tathanhloc.youthkgu.Enum.TrangThaiGopY;
import com.tathanhloc.youthkgu.Service.GopYService;
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
 * Quản lý góp ý-phản ánh — chỉ admin/BCH có quyền XEM_GOP_Y / XU_LY_GOP_Y.
 * GY-002: mọi response ở đây dùng GopYAdminDTO — CỐ TÌNH không có field định danh
 * người gửi để đảm bảo tính minh bạch/dân chủ theo đúng yêu cầu nghiệp vụ.
 */
@RestController
@RequestMapping("/api/gop-y-manage")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Quản Lý Góp Ý", description = "API quản lý/xử lý góp ý-phản ánh (ẩn danh người gửi)")
public class GopYManageController {

    private final GopYService gopYService;

    @GetMapping
    @Operation(summary = "Danh sách góp ý (ẩn danh), lọc theo trạng thái nếu có")
    @PreAuthorize("hasPermission(null, 'XEM_GOP_Y')")
    public ResponseEntity<ApiResponse<Page<GopYAdminDTO>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String trangThai) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        TrangThaiGopY filter = null;
        if (trangThai != null && !trangThai.isBlank()) {
            try { filter = TrangThaiGopY.valueOf(trangThai); } catch (IllegalArgumentException ignored) {}
        }
        return ResponseEntity.ok(ApiResponse.success(gopYService.getAllForAdmin(pageable, filter)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết 1 góp ý (ẩn danh)")
    @PreAuthorize("hasPermission(null, 'XEM_GOP_Y')")
    public ResponseEntity<ApiResponse<GopYAdminDTO>> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(gopYService.getDetailForAdmin(id)));
    }

    @PatchMapping("/{id}/phan-hoi")
    @Operation(summary = "Phản hồi và cập nhật trạng thái xử lý góp ý")
    @PreAuthorize("hasPermission(null, 'XU_LY_GOP_Y')")
    public ResponseEntity<ApiResponse<GopYAdminDTO>> respond(
            @PathVariable Long id,
            @RequestBody GopYPhanHoiRequest req,
            Authentication authentication) {
        log.info("PATCH /api/gop-y-manage/{}/phan-hoi by {}", id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã phản hồi", gopYService.respond(id, req, authentication.getName())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm góp ý")
    @PreAuthorize("hasPermission(null, 'XU_LY_GOP_Y')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("DELETE /api/gop-y-manage/{}", id);
        gopYService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in GopYManageController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
