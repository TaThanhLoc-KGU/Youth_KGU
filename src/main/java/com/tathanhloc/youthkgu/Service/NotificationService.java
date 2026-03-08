package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Enum.TrangThaiHoatDongEnum;
import com.tathanhloc.youthkgu.Model.HoatDong;
import com.tathanhloc.youthkgu.Model.Notification;
import com.tathanhloc.youthkgu.Model.PushSubscription;
import com.tathanhloc.youthkgu.Repository.HoatDongRepository;
import com.tathanhloc.youthkgu.Repository.NotificationRepository;
import com.tathanhloc.youthkgu.Repository.PushSubscriptionRepository;
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
    private final HoatDongRepository hoatDongRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final PushSubscriptionService pushSubscriptionService;

    /** SSE emitter map — chỉ lưu user đang active trên tab (in-memory, không scale) */
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    // ── SSE ───────────────────────────────────────────────────────────────────

    public SseEmitter createEmitter(String userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));

        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected"));
        } catch (IOException e) {
            log.error("Error sending SSE init event", e);
        }
        return emitter;
    }

    // ── Gửi đến 1 user ────────────────────────────────────────────────────────

    /**
     * Lưu notification vào DB + push real-time qua SSE (nếu đang online)
     * + Web Push (nếu đã bật thông báo browser).
     */
    @Transactional
    public void sendNotification(String userId, String title, String message,
                                 String type, String relatedId) {
        // 1. Lưu vào DB luôn (để user xem lại dù offline)
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .relatedId(relatedId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // 2. SSE real-time nếu user đang mở tab
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(notification));
                log.debug("SSE sent to user: {}", userId);
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }

        // 3. Web Push nếu user đã bật thông báo (async, không block)
        pushSubscriptionService.sendToUser(userId, title, message, null);
    }

    // ── Broadcast (chỉ gửi cho người đã đăng ký) ─────────────────────────────

    /**
     * TRƯỚC: gửi cho toàn bộ 8000 sinh viên → lãng phí.
     * SAU:   chỉ gửi DB notification cho user đang online (SSE),
     *        và Web Push cho tất cả thiết bị đã đăng ký (push subscription).
     *
     * Điều này giúp giảm số DB insert từ O(N_students) xuống còn
     * O(N_online_users) + O(N_subscriptions).
     */
    @Transactional
    public void sendNotificationToAllStudents(String title, String message,
                                              String type, String relatedId) {
        // a) Lưu DB notification CHỈ cho user đang kết nối SSE (đang mở app)
        int dbCount = 0;
        for (String userId : emitters.keySet()) {
            Notification notification = Notification.builder()
                    .userId(userId)
                    .title(title)
                    .message(message)
                    .type(type)
                    .relatedId(relatedId)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
            dbCount++;

            // Gửi SSE ngay
            SseEmitter emitter = emitters.get(userId);
            if (emitter != null) {
                try {
                    emitter.send(SseEmitter.event().name("notification").data(notification));
                } catch (IOException e) {
                    emitters.remove(userId);
                }
            }
        }

        // b) Web Push đến tất cả thiết bị đã đăng ký (bất kể online/offline)
        int pushCount = pushSubscriptionService.sendToAll(title, message, null);

        log.info("Broadcast hoàn tất: DB={} (online users), WebPush={} thiết bị, title='{}'",
                dbCount, pushCount, title);
    }

    // ── Read / Count ──────────────────────────────────────────────────────────

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

    /** Số thiết bị / user đang đăng ký push — cho admin xem trước khi broadcast */
    public Map<String, Long> getBroadcastPreview() {
        return Map.of(
                "onlineUsers", (long) emitters.size(),
                "pushSubscriptions", pushSubscriptionRepository.countByIsActiveTrue(),
                "pushUsers", pushSubscriptionRepository.countDistinctActiveUsers()
        );
    }

    // ── Scheduled Jobs ────────────────────────────────────────────────────────

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
                            "Hoạt động \"" + hd.getTenHoatDong() + "\" sẽ diễn ra vào ngày mai!",
                            "REMINDER",
                            hd.getMaHoatDong()
                    );
                });
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupJob() {
        log.info("Running cleanup job for old notifications (> 30 days)");
        notificationRepository.deleteOldNotifications(LocalDateTime.now().minusDays(30));
    }
}
