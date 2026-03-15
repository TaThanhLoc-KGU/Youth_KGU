package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.PushSubscriptionRequest;
import com.tathanhloc.youthkgu.Model.PushSubscription;
import com.tathanhloc.youthkgu.Repository.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Quản lý đăng ký Web Push và gửi push notification đến trình duyệt.
 * Dùng VAPID (Voluntary Application Server Identification) — không cần FCM hay GCM key.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PushSubscriptionService {

    private final PushSubscriptionRepository repo;

    @Value("${app.vapid.public-key}")
    private String vapidPublicKey;

    @Value("${app.vapid.private-key}")
    private String vapidPrivateKey;

    @Value("${app.vapid.subject}")
    private String vapidSubject;

    private PushService pushService;

    @PostConstruct
    public void init() {
        // BouncyCastle cần được đăng ký để xử lý mã hóa elliptic curve
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        try {
            pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            log.info("PushService khởi tạo thành công với VAPID subject: {}", vapidSubject);
        } catch (Exception e) {
            log.error("Không thể khởi tạo PushService — kiểm tra lại VAPID keys trong application.properties", e);
        }
    }

    // ── Subscribe / Unsubscribe ────────────────────────────────────────────────

    @Transactional
    public void subscribe(String userId, PushSubscriptionRequest req) {
        // Nếu endpoint đã tồn tại thì cập nhật lại (cùng thiết bị, token mới)
        PushSubscription sub = repo.findByEndpoint(req.getEndpoint())
                .orElse(PushSubscription.builder()
                        .userId(userId)
                        .endpoint(req.getEndpoint())
                        .build());

        sub.setUserId(userId);
        sub.setP256dh(req.getP256dh());
        sub.setAuth(req.getAuth());
        sub.setDeviceInfo(req.getDeviceInfo());
        sub.setActive(true);
        repo.save(sub);
        log.info("Push subscription đã lưu: user={}, device={}", userId, req.getDeviceInfo());
    }

    @Transactional
    public void unsubscribe(String userId, String endpoint) {
        repo.findByEndpoint(endpoint).ifPresent(sub -> {
            if (sub.getUserId().equals(userId)) {
                sub.setActive(false);
                repo.save(sub);
                log.info("Đã hủy push subscription: user={}", userId);
            }
        });
    }

    @Transactional
    public void unsubscribeAll(String userId) {
        repo.findByUserIdAndIsActiveTrue(userId).forEach(sub -> {
            sub.setActive(false);
            repo.save(sub);
        });
        log.info("Đã hủy tất cả push subscription: user={}", userId);
    }

    public boolean isSubscribed(String userId) {
        return repo.existsByUserIdAndIsActiveTrue(userId);
    }

    public long countActiveSubscriptions() {
        return repo.countByIsActiveTrue();
    }

    public long countActiveUsers() {
        return repo.countDistinctActiveUsers();
    }

    // ── Gửi push ──────────────────────────────────────────────────────────────

    /**
     * Gửi push notification đến một user cụ thể (tất cả thiết bị của họ).
     */
    public void sendToUser(String userId, String title, String body, String url) {
        if (pushService == null) {
            log.warn("PushService chưa khởi tạo — bỏ qua push cho user {}", userId);
            return;
        }
        List<PushSubscription> subs = repo.findByUserIdAndIsActiveTrue(userId);
        subs.forEach(sub -> sendPush(sub, title, body, url));
    }

    /**
     * Gửi broadcast đến TẤT CẢ user đã đăng ký.
     * Trả về số thiết bị đã gửi thành công.
     */
    public int sendToAll(String title, String body, String url) {
        if (pushService == null) {
            log.warn("PushService chưa khởi tạo — bỏ qua broadcast push");
            return 0;
        }
        List<PushSubscription> subs = repo.findAllByIsActiveTrue();
        log.info("Gửi push broadcast: title='{}', {} thiết bị", title, subs.size());
        int success = 0;
        for (PushSubscription sub : subs) {
            if (sendPush(sub, title, body, url)) success++;
        }
        log.info("Push broadcast hoàn tất: {}/{} thiết bị nhận được", success, subs.size());
        return success;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    /**
     * Gửi push đến một subscription, tự xóa nếu endpoint đã chết (410 Gone).
     * @return true nếu gửi thành công
     */
    @Transactional
    public boolean sendPush(PushSubscription sub, String title, String body, String url) {
        try {
            // Payload JSON tương thích với service worker showNotification()
            String payload = String.format(
                    "{\"title\":\"%s\",\"body\":\"%s\",\"url\":\"%s\",\"icon\":\"/icon-192.png\"}",
                    escapeJson(title), escapeJson(body), url != null ? url : "/"
            );

            Subscription webSub = new Subscription(
                    sub.getEndpoint(),
                    new Subscription.Keys(sub.getP256dh(), sub.getAuth())
            );

            Notification notification = new Notification(webSub, payload);
            org.apache.http.HttpResponse response = pushService.send(notification);

            int status = response.getStatusLine().getStatusCode();

            if (status == 201 || status == 200) {
                sub.setLastUsedAt(LocalDateTime.now());
                repo.save(sub);
                return true;
            } else if (status == 410 || status == 404) {
                // Endpoint đã bị thu hồi — tự dọn dẹp (Self-Cleaning)
                log.info("Push endpoint hết hạn ({}), xóa subscription id={}", status, sub.getId());
                sub.setActive(false);
                repo.save(sub);
                return false;
            } else {
                log.warn("Push thất bại với HTTP {}: sub id={}", status, sub.getId());
                return false;
            }
        } catch (Exception e) {
            log.error("Lỗi gửi push đến subscription id={}: {}", sub.getId(), e.getMessage());
            return false;
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    /**
     * Thống kê cho admin — số thiết bị và người dùng đang active.
     */
    public Map<String, Long> getStats() {
        return Map.of(
                "activeSubscriptions", repo.countByIsActiveTrue(),
                "activeUsers", repo.countDistinctActiveUsers()
        );
    }
}
