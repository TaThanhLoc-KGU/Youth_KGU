package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.BinhLuanCreateRequest;
import com.tathanhloc.youthkgu.DTO.BinhLuanDTO;
import com.tathanhloc.youthkgu.DTO.ReactionSummaryDTO;
import com.tathanhloc.youthkgu.Security.CustomUserDetails;
import com.tathanhloc.youthkgu.Service.TinTucBinhLuanService;
import com.tathanhloc.youthkgu.Service.TinTucTuongTacService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Like / bình luận / chia sẻ bài viết eNews — API CÔNG KHAI (permitAll qua /api/public/**),
 * hoạt động cho CẢ khách (ẩn danh) lẫn tài khoản đã đăng nhập.
 * <p>
 * Pattern bắt buộc cho endpoint dual-mode: khi KHÔNG có JWT hợp lệ, Spring gán sẵn
 * AnonymousAuthenticationToken với principal là String "anonymousUser" — TUYỆT ĐỐI
 * không được cast thẳng sang CustomUserDetails (sẽ ném ClassCastException). Luôn dùng
 * "instanceof CustomUserDetails" để kiểm tra an toàn.
 */
@RestController
@RequestMapping("/api/public/news")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tương Tác Tin Tức", description = "API like/bình luận/chia sẻ — hỗ trợ cả khách và tài khoản")
public class TinTucTuongTacController {

    private final TinTucBinhLuanService binhLuanService;
    private final TinTucTuongTacService tuongTacService;

    // ══════════════════════════════════════════════════════════════════════
    // BÌNH LUẬN
    // ══════════════════════════════════════════════════════════════════════

    @GetMapping("/{id}/binh-luan")
    @Operation(summary = "Danh sách bình luận công khai (chỉ hiển thị)")
    public ResponseEntity<ApiResponse<Page<BinhLuanDTO>>> getBinhLuan(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(binhLuanService.getVisibleComments(id, pageable)));
    }

    @PostMapping("/{id}/binh-luan")
    @Operation(summary = "Gửi bình luận mới — khách phải nhập đủ họ tên/sđt/email, tài khoản tự lấy hoTen")
    public ResponseEntity<ApiResponse<BinhLuanDTO>> postBinhLuan(
            @PathVariable Long id,
            @RequestBody BinhLuanCreateRequest req,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        CustomUserDetails userOrNull = resolveUser(authentication);
        String ip = resolveClientIp(httpRequest);
        log.info("POST /api/public/news/{}/binh-luan - khach={}", id, userOrNull == null);
        BinhLuanDTO dto = binhLuanService.create(id, req, userOrNull, ip);
        return ResponseEntity.ok(ApiResponse.success("Gửi bình luận thành công", dto));
    }

    // ══════════════════════════════════════════════════════════════════════
    // LƯỢT THÍCH / CHIA SẺ
    // ══════════════════════════════════════════════════════════════════════

    @GetMapping("/{id}/reactions")
    @Operation(summary = "Trạng thái tương tác hiện tại (lượt thích/bình luận/chia sẻ, đã thích chưa)")
    public ResponseEntity<ApiResponse<ReactionSummaryDTO>> getReactions(
            @PathVariable Long id,
            @RequestParam(required = false) String deviceId,
            Authentication authentication) {
        CustomUserDetails userOrNull = resolveUser(authentication);
        String username = userOrNull != null ? userOrNull.getUsername() : null;
        return ResponseEntity.ok(ApiResponse.success(tuongTacService.getReactionSummary(id, username, deviceId)));
    }

    @PostMapping("/{id}/thich")
    @Operation(summary = "Toggle thích/bỏ thích — ưu tiên tài khoản, ngược lại dedup theo deviceId ẩn danh")
    public ResponseEntity<ApiResponse<ReactionSummaryDTO>> toggleThich(
            @PathVariable Long id,
            @RequestBody(required = false) ThichBody body,
            Authentication authentication) {
        CustomUserDetails userOrNull = resolveUser(authentication);
        String username = userOrNull != null ? userOrNull.getUsername() : null;
        String deviceId = body != null ? body.deviceId() : null;
        return ResponseEntity.ok(ApiResponse.success(tuongTacService.toggleLike(id, username, deviceId)));
    }

    @PostMapping("/{id}/chia-se")
    @Operation(summary = "Ghi nhận 1 lượt chia sẻ (không cần định danh)")
    public ResponseEntity<ApiResponse<Integer>> chiaSe(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tuongTacService.recordShare(id)));
    }

    // ══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════

    public record ThichBody(String deviceId) {}

    private CustomUserDetails resolveUser(Authentication authentication) {
        return (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails cud) ? cud : null;
    }

    private String resolveClientIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        return (xf != null && !xf.isBlank()) ? xf.split(",")[0].trim() : req.getRemoteAddr();
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in TinTucTuongTacController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
