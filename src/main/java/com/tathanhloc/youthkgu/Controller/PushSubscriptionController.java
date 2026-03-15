package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.PushSubscriptionRequest;
import com.tathanhloc.youthkgu.Service.PushSubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Web Push", description = "API quản lý đăng ký và hủy đăng ký push notification")
public class PushSubscriptionController {

    private final PushSubscriptionService service;

    // ── Public: frontend cần VAPID public key trước khi subscribe ─────────────

    @GetMapping("/vapid-public-key")
    @Operation(summary = "Lấy VAPID public key (public, không cần đăng nhập)")
    public ResponseEntity<ApiResponse<String>> getVapidPublicKey() {
        return ResponseEntity.ok(ApiResponse.success(service.getVapidPublicKey()));
    }

    // ── Authenticated user ─────────────────────────────────────────────────────

    @PostMapping("/subscribe")
    @Operation(summary = "Đăng ký push notification cho thiết bị hiện tại")
    public ResponseEntity<ApiResponse<Void>> subscribe(
            @RequestBody PushSubscriptionRequest req,
            Authentication auth) {
        String userId = auth.getName();
        log.info("POST /api/push/subscribe - user={}, device={}", userId, req.getDeviceInfo());
        service.subscribe(userId, req);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/unsubscribe")
    @Operation(summary = "Hủy đăng ký push notification cho endpoint cụ thể")
    public ResponseEntity<ApiResponse<Void>> unsubscribe(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String userId = auth.getName();
        String endpoint = body.get("endpoint");
        log.info("DELETE /api/push/unsubscribe - user={}", userId);
        service.unsubscribe(userId, endpoint);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/unsubscribe-all")
    @Operation(summary = "Hủy đăng ký push notification trên tất cả thiết bị")
    public ResponseEntity<ApiResponse<Void>> unsubscribeAll(Authentication auth) {
        service.unsubscribeAll(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/status")
    @Operation(summary = "Kiểm tra user hiện tại có đang đăng ký push không")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(Authentication auth) {
        boolean subscribed = service.isSubscribed(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(Map.of("subscribed", subscribed)));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    @Operation(summary = "Thống kê số thiết bị và người dùng đã bật thông báo (admin)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(service.getStats()));
    }
}
