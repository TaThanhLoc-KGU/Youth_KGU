package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.Service.WebPushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API đăng ký/hủy đăng ký Web Push (VAPID) — cho phép thông báo đến người dùng ngay cả khi
 * họ đã đóng hẳn tab/app, khác với SSE (/api/notifications/stream) chỉ hoạt động khi tab đang mở.
 * Mọi endpoint đều yêu cầu đăng nhập (isAuthenticated) — không cần quyền đặc biệt vì đây là
 * hành động tự phục vụ của chính người dùng (giống PublicNewsController.dangKyPublic()).
 */
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
@Slf4j
public class PushSubscriptionController {

    private final WebPushService webPushService;

    /** Trả public key VAPID cho frontend dùng khi gọi PushManager.subscribe({applicationServerKey}). */
    @GetMapping("/vapid-public-key")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> getVapidPublicKey() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("publicKey", webPushService.getVapidPublicKeyBase64())));
    }

    /** Đăng ký subscription mới (hoặc cập nhật nếu endpoint đã tồn tại) cho user hiện tại. */
    @PostMapping("/subscribe")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> subscribe(@RequestBody SubscribeBody body, Authentication authentication) {
        try {
            webPushService.subscribe(
                    authentication.getName(),
                    body.endpoint(),
                    body.keys() != null ? body.keys().p256dh() : null,
                    body.keys() != null ? body.keys().auth() : null,
                    body.userAgent());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Hủy đăng ký — gọi khi user tắt thông báo đẩy hoặc trình duyệt báo subscription hết hạn.
     * Chỉ xóa subscription thuộc về chính user đang gọi (theo username, không chỉ theo endpoint)
     * để tránh 1 user đã đăng nhập xóa được subscription của user khác (IDOR).
     */
    @DeleteMapping("/unsubscribe")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> unsubscribe(@RequestParam String endpoint, Authentication authentication) {
        webPushService.unsubscribe(authentication.getName(), endpoint);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** Gửi 1 push thử nghiệm tới chính người gọi — để user tự kiểm tra tính năng có hoạt động thật hay không. */
    @PostMapping("/test")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> testPush(Authentication authentication) {
        log.info("Gửi push thử nghiệm cho user: {}", authentication.getName());
        webPushService.sendPushToUser(
                authentication.getName(),
                "Thử nghiệm thông báo đẩy",
                "Nếu bạn thấy thông báo này, Web Push đã hoạt động!",
                "/");
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    public record KeysBody(String p256dh, String auth) {}

    public record SubscribeBody(String endpoint, KeysBody keys, String userAgent) {}

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Lỗi trong PushSubscriptionController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
