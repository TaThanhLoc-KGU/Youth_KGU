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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
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
    private final WebPushService webPushService;
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * Self-reference qua Spring proxy (@Lazy phá vòng lặp khởi tạo bean). Bắt buộc để @Async thật sự
     * có hiệu lực khi 1 method trong CHÍNH class này gọi 1 method @Async khác — gọi "this.xxx()" trực
     * tiếp (self-invocation) sẽ bỏ qua proxy của Spring nên @Async không chạy (vẫn chạy đồng bộ).
     * PHẢI là field không final + @Autowired @Lazy (không phải constructor injection qua Lombok
     * @RequiredArgsConstructor) — Lombok KHÔNG copy @Lazy sang tham số constructor được sinh ra, nên
     * field final sẽ gây BeanCurrentlyInCreationException khi khởi động. Đúng theo pattern đã dùng ở
     * AccountService.accountServiceSelf / AuthService.authenticationManager trong cùng project.
     */
    @Autowired
    @Lazy
    private NotificationService self;

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

        // Gửi Web Push (RFC 8291) — tới được thiết bị kể cả khi tab/app đã đóng hẳn (không chỉ minimize).
        // Tách riêng try/catch giống pushSseNotification(): lỗi push không được phá transaction/luồng chính.
        try {
            webPushService.sendPushToUser(userId, title, message, buildNotificationUrl(type, relatedId));
        } catch (Exception e) {
            log.warn("Lỗi khi gửi web push cho user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Đường dẫn trong app tương ứng với loại thông báo — nhúng vào payload push để khi người dùng
     * bấm vào thông báo đẩy sẽ mở đúng trang liên quan. Không cần quá phức tạp, chỉ cần không null.
     */
    private String buildNotificationUrl(String type, String relatedId) {
        if (type == null) return "/";
        return switch (type) {
            case "NEW_ACTIVITY", "REMINDER", "ATTENDANCE_RESULT" -> "/student/activities";
            default -> "/";
        };
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

    /**
     * Gửi thông báo tới TẤT CẢ sinh viên. CHẠY BẤT ĐỒNG BỘ (@Async) — vòng lặp gửi cho hàng trăm/nghìn
     * sinh viên (mỗi lượt: insert DB + thử SSE + thử Web Push) có thể mất nhiều giây; nếu chạy đồng bộ
     * ngay trong request gọi hàm này (vd trong 1 @Transactional khác như duyệt/công khai hoạt động) sẽ
     * làm request đó bị delay nặng, thậm chí timeout. Gọi hàm này KHÔNG chờ kết quả (fire-and-forget).
     */
    @Async
    public void sendNotificationToAllStudents(String title, String message, String type, String relatedId) {
        log.info("Sending notification to all students: {}", title);
        // Chỉ lấy maSv (không load toàn bộ entity) để tiết kiệm RAM
        List<String> allMaSv = sinhVienRepository.findAllMaSv();
        allMaSv.forEach(maSv -> {
            try {
                sendNotification(maSv, title, message, type, relatedId);
            } catch (Exception e) {
                // Một sinh viên lỗi không được crash toàn bộ loop
                log.warn("Failed to send notification to student {}: {}", maSv, e.getMessage());
            }
        });
        log.info("Sent notification to {} students (async): {}", allMaSv.size(), title);
    }

    /**
     * Gửi thông báo đến TẤT CẢ tài khoản đang hoạt động trong hệ thống.
     * Dùng khi Bí thư / Admin muốn broadcast tin tức, văn bản, hoạt động.
     * Đếm số người nhận NGAY (nhanh, không IO ngoài DB) rồi trả về; việc gửi thực tế cho từng người
     * chạy bất đồng bộ ở sendToUsersAsync() để không chặn request — xem lý do trong javadoc của
     * sendNotificationToAllStudents().
     */
    @Transactional(readOnly = true)
    public int sendBroadcastNotification(String title, String message, String type, String relatedId) {
        List<String> usernames = taiKhoanRepository.findAllActiveUsernames();
        log.info("Broadcasting notification to all active users: type={} relatedId={} total={}",
                type, relatedId, usernames.size());
        self.sendToUsersAsync(usernames, title, message, type, relatedId);
        return usernames.size();
    }

    /** Phần gửi thực tế của sendBroadcastNotification() — tách riêng để @Async có hiệu lực (xem field self). */
    @Async
    public void sendToUsersAsync(List<String> usernames, String title, String message, String type, String relatedId) {
        usernames.forEach(username -> {
            try {
                sendNotification(username, title, message, type, relatedId);
            } catch (Exception e) {
                log.warn("Failed to broadcast to user {}: {}", username, e.getMessage());
            }
        });
        log.info("Broadcast sent to {} users (async)", usernames.size());
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
                    self.sendNotificationToAllStudents(
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
