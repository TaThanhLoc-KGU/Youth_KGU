package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.GopYCreateRequest;
import com.tathanhloc.youthkgu.DTO.GopYDTO;
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
 * Thùng thư góp ý — API cho sinh viên/tài khoản đã đăng nhập gửi phản ánh/góp ý
 * và xem lại lịch sử của chính mình. GY-001: bắt buộc đăng nhập (hasRole('USER')),
 * theo đúng pattern PublicNewsController.dangKyPublic().
 */
@RestController
@RequestMapping("/api/public/gop-y")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Góp Ý", description = "API gửi và xem góp ý-phản ánh (sinh viên)")
public class GopYController {

    private final GopYService gopYService;

    @PostMapping
    @Operation(summary = "Gửi góp ý/phản ánh mới")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<GopYDTO>> submit(
            @RequestBody GopYCreateRequest req,
            Authentication authentication) {
        String username = authentication.getName();
        log.info("POST /api/public/gop-y by {}", username);
        return ResponseEntity.ok(ApiResponse.success("Gửi góp ý thành công", gopYService.submit(req, username)));
    }

    @GetMapping("/cua-toi")
    @Operation(summary = "Lịch sử góp ý của tài khoản hiện tại")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Page<GopYDTO>>> getMySubmissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        String username = authentication.getName();
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(gopYService.getMySubmissions(username, pageable)));
    }

    @GetMapping("/cua-toi/{id}")
    @Operation(summary = "Chi tiết 1 góp ý của tài khoản hiện tại")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<GopYDTO>> getMySubmission(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(ApiResponse.success(gopYService.getMySubmission(id, username)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in GopYController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
