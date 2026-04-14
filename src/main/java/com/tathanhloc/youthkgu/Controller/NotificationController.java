package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.Model.Notification;
import com.tathanhloc.youthkgu.Service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(Authentication authentication) {
        if (authentication == null) {
            log.warn("Anonymous user tried to connect to SSE");
            return null;
        }
        return notificationService.createEmitter(authentication.getName());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(Authentication authentication) {
        if (authentication == null) {
            log.warn("Anonymous user tried to get notifications");
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized", null));
        }
        log.info("Fetching notifications for user: {}", authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(notificationService.getNotifications(authentication.getName())));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(authentication.getName())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * POST /api/notifications/broadcast
     * Gửi thông báo đến tất cả người dùng đang hoạt động.
     * Yêu cầu quyền: DANG_TIN_TUC hoặc TAO_HOAT_DONG hoặc QUAN_LY_VAN_BAN
     */
    @PostMapping("/broadcast")
    @PreAuthorize("hasPermission(null, 'DANG_TIN_TUC') or hasPermission(null, 'TAO_HOAT_DONG') or hasPermission(null, 'QUAN_LY_VAN_BAN')")
    public ResponseEntity<ApiResponse<Integer>> broadcast(
            @RequestBody BroadcastRequest request,
            Authentication authentication) {
        log.info("Broadcast notification by {}: type={} relatedId={}", authentication.getName(), request.getType(), request.getRelatedId());
        int count = notificationService.sendBroadcastNotification(
                request.getTitle(), request.getMessage(), request.getType(), request.getRelatedId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /** DTO nội bộ cho broadcast request */
    @Data
    public static class BroadcastRequest {
        private String title;
        private String message;
        private String type;
        private String relatedId;
    }
}
