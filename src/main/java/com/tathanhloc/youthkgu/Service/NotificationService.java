package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Enum.TrangThaiHoatDongEnum;
import com.tathanhloc.youthkgu.Model.HoatDong;
import com.tathanhloc.youthkgu.Model.Notification;
import com.tathanhloc.youthkgu.Repository.HoatDongRepository;
import com.tathanhloc.youthkgu.Repository.NotificationRepository;
import com.tathanhloc.youthkgu.Repository.SinhVienRepository;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final SinhVienRepository sinhVienRepository;
    private final HoatDongRepository hoatDongRepository;
    private final TaiKhoanRepository taiKhoanRepository;
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter createEmitter(String userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));

        // Send initial heartbeat
        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected"));
        } catch (IOException e) {
            log.error("Error sending init event", e);
        }

        return emitter;
    }

    @Transactional
    public void sendNotification(String userId, String title, String message, String type, String relatedId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .relatedId(relatedId)
                .isRead(false)
                .build();

        notificationRepository.save(notification);

        // Gửi SSE sau khi đã lưu DB — không để exception SSE phá transaction
        pushSseNotification(userId, notification);
    }

    /**
     * Đẩy thông báo real-time qua SSE.
     * Tách riêng khỏi @Transactional để lỗi SSE không rollback DB.
     * AsyncRequestNotUsableException (IllegalStateException) xảy ra khi client đã ngắt kết nối
     * — cần catch Exception (không chỉ IOException).
     */
    private void pushSseNotification(String userId, Notification notification) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) return;

        try {
            emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(notification));
            log.debug("Sent real-time notification to user: {}", userId);
        } catch (Exception e) {
            // AsyncRequestNotUsableException extends IllegalStateException (không phải IOException)
            // → phải catch Exception để bắt đúng
            emitters.remove(userId);
            try { emitter.complete(); } catch (Exception ignored) {}
            log.warn("SSE emitter dead for user={}, removed. Reason: {}", userId, e.getMessage());
        }
    }

    @Transactional
    public void sendNotificationToAllStudents(String title, String message, String type, String relatedId) {
        log.info("Sending notification to all students: {}", title);
        // Chỉ lấy maSv (không load toàn bộ entity) để tiết kiệm RAM
        sinhVienRepository.findAllMaSv().forEach(maSv -> {
            try {
                sendNotification(maSv, title, message, type, relatedId);
            } catch (Exception e) {
                // Một sinh viên lỗi không được crash toàn bộ loop
                log.warn("Failed to send notification to student {}: {}", maSv, e.getMessage());
            }
        });
    }

    /**
     * Gửi thông báo đến TẤT CẢ tài khoản đang hoạt động trong hệ thống.
     * Dùng khi Bí thư / Admin muốn broadcast tin tức, văn bản, hoạt động.
     * Trả về số lượng tài khoản đã nhận.
     */
    @Transactional
    public int sendBroadcastNotification(String title, String message, String type, String relatedId) {
        log.info("Broadcasting notification to all active users: type={} relatedId={}", type, relatedId);
        List<String> usernames = taiKhoanRepository.findAllActiveUsernames();
        usernames.forEach(username -> {
            try {
                sendNotification(username, title, message, type, relatedId);
            } catch (Exception e) {
                log.warn("Failed to broadcast to user {}: {}", username, e.getMessage());
            }
        });
        log.info("Broadcast sent to {} users", usernames.size());
        return usernames.size();
    }

    public List<Notification> getNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    // ========== SCHEDULED JOBS ==========

    @Scheduled(cron = "0 0 7 * * *")
    public void reminderJob() {
        log.info("Running daily reminder job for tomorrow's activities");
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<HoatDong> activities = hoatDongRepository.findByDateRange(tomorrow, tomorrow);
        activities.stream()
                .filter(hd -> hd.getTrangThai() == TrangThaiHoatDongEnum.SAP_DIEN_RA
                        || hd.getTrangThai() == TrangThaiHoatDongEnum.DANG_MO_DANG_KY)
                .forEach(hd -> {
                    log.info("Sending reminder for activity: {}", hd.getMaHoatDong());
                    sendNotificationToAllStudents(
                            "Nhắc nhở: Hoạt động ngày mai",
                            "Hoạt động \"" + hd.getTenHoatDong() + "\" sẽ diễn ra vào ngày mai. Hãy chuẩn bị!",
                            "REMINDER",
                            hd.getMaHoatDong()
                    );
                });
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupJob() {
        log.info("Running cleanup job for old notifications");
        notificationRepository.deleteOldNotifications(LocalDateTime.now().minusDays(30));
    }
}
