package com.tathanhloc.youthkgu.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tathanhloc.youthkgu.Model.PushSubscription;
import com.tathanhloc.youthkgu.Repository.PushSubscriptionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * Service Web Push chuẩn RFC 8030/8291/8292 (VAPID).
 * Khác với SSE hiện có (chỉ hoạt động khi tab đang mở kết nối), Web Push đẩy được thông báo
 * tới trình duyệt ngay cả khi tab/app đã đóng hẳn, thông qua Push Service của trình duyệt
 * (FCM/Mozilla/Apple...) — nhờ Service Worker 'push' event lắng nghe ở tầng OS.
 *
 * Cặp khóa VAPID PHẢI ổn định qua các lần khởi động server — nếu đổi khóa, mọi subscription
 * cũ (đã lưu applicationServerKey cũ trong trình duyệt) sẽ không còn nhận được push nữa,
 * người dùng phải bấm "Bật thông báo đẩy" lại từ đầu. Thứ tự ưu tiên khi khởi động:
 *   1) application.properties: app.vapid.public-key / app.vapid.private-key
 *   2) File {app.secure-data.path}/vapid-keys.properties (đã lưu từ lần sinh trước — CỐ TÌNH
 *      KHÔNG dùng app.upload.path vì thư mục đó bị serve công khai qua GET /uploads/**)
 *   3) Sinh mới (EC secp256r1) và lưu lại vào file trên để lần sau tái sử dụng
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final ObjectMapper objectMapper;

    /**
     * CHÚ Ý BẢO MẬT: KHÔNG được lưu file khóa VAPID dưới app.upload.path — WebConfig.java map
     * "/uploads/**" (permitAll GET trong SecurityConfig) thẳng vào thư mục đó trên đĩa, nghĩa là
     * bất kỳ file nào đặt trong app.upload.path đều bị public tải về được, kể cả private key.
     * Dùng một thư mục RIÊNG, không được serve công khai, cho dữ liệu nhạy cảm dạng này.
     */
    @Value("${app.secure-data.path:./secure-data}")
    private String secureDataPath;

    /** Cấu hình tĩnh (nếu có) — ưu tiên cao nhất, dùng cho production đã generate sẵn key. */
    @Value("${app.vapid.public-key:}")
    private String configuredPublicKey;

    @Value("${app.vapid.private-key:}")
    private String configuredPrivateKey;

    @Value("${app.vapid.subject:mailto:admin@youthkgu.edu.vn}")
    private String vapidSubject;

    /** Public key base64url đang dùng — trả cho frontend qua GET /api/push/vapid-public-key. */
    private String vapidPublicKeyBase64;

    /** null nếu VAPID không khởi tạo được (lỗi cấu hình) — mọi thao tác gửi push sẽ tự bỏ qua. */
    private PushService pushService;

    @PostConstruct
    public void init() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        try {
            String[] keyPair = resolveVapidKeyPair();
            this.vapidPublicKeyBase64 = keyPair[0];
            this.pushService = new PushService(keyPair[0], keyPair[1], vapidSubject);
            log.info("Web Push (VAPID) đã sẵn sàng — public key: {}...",
                    keyPair[0].substring(0, Math.min(20, keyPair[0].length())));
        } catch (Exception e) {
            log.error("Không thể khởi tạo Web Push VAPID — tính năng push đẩy sẽ bị TẮT (SSE vẫn hoạt động bình thường): {}",
                    e.getMessage(), e);
        }
    }

    public String getVapidPublicKeyBase64() {
        return vapidPublicKeyBase64;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ĐĂNG KÝ / HỦY ĐĂNG KÝ
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Danh sách host push service hợp lệ theo chuẩn Web Push (RFC 8030) mà trình duyệt tự sinh ra
     * trong PushManager.subscribe() — client KHÔNG được tự chọn endpoint tùy ý.
     */
    private static final java.util.Set<String> ALLOWED_PUSH_ENDPOINT_HOSTS = java.util.Set.of(
            "fcm.googleapis.com",          // Chrome / Edge (Chromium) / Android
            "android.googleapis.com",      // Android WebView cũ
            "updates.push.services.mozilla.com", // Firefox
            "push.services.mozilla.com",
            "web.push.apple.com",          // Safari
            "notify.windows.com"           // Edge cũ / WNS
    );

    /**
     * Đăng ký (hoặc cập nhật) một subscription theo endpoint.
     * Upsert theo endpoint: cùng 1 thiết bị/trình duyệt chỉ giữ 1 bản ghi — nếu người dùng
     * đăng nhập tài khoản khác trên cùng thiết bị đó, username sẽ được ghi đè.
     *
     * BẢO MẬT (chống SSRF - CWE-918): endpoint do CLIENT gửi lên hoàn toàn tự do (body JSON của
     * POST /api/push/subscribe). WebPushService sau này sẽ tự động gửi HTTP POST tới đúng URL này
     * (qua sendPushToUser/sendToOne) mỗi khi có thông báo cho user đó — kể cả tự động qua cron job
     * nhắc nhở hằng ngày hoặc NGAY LẬP TỨC qua POST /api/push/test. Nếu không kiểm tra, một user
     * đã đăng nhập (vd sinh viên bình thường) có thể đặt endpoint = URL nội bộ tùy ý (vd
     * http://169.254.169.254/..., http://localhost:xxxx/actuator/..., địa chỉ mạng nội bộ) khiến
     * server tự động gửi request tới đó — SSRF mù nhưng vẫn khai thác được để quét mạng nội bộ /
     * gọi API nội bộ không cần xác thực riêng. Vì vậy CHỈ chấp nhận endpoint có scheme https và
     * host thuộc danh sách các push service đã biết.
     */
    @Transactional
    public void subscribe(String username, String endpoint, String p256dh, String auth, String userAgent) {
        if (!isAllowedPushEndpoint(endpoint)) {
            log.warn("Từ chối đăng ký Web Push: endpoint không hợp lệ/không thuộc push service đã biết (user={})", username);
            throw new IllegalArgumentException("Endpoint không hợp lệ");
        }
        PushSubscription sub = pushSubscriptionRepository.findByEndpoint(endpoint)
                .orElseGet(() -> PushSubscription.builder().endpoint(endpoint).build());
        sub.setUsername(username);
        sub.setP256dh(p256dh);
        sub.setAuth(auth);
        sub.setUserAgent(userAgent);
        pushSubscriptionRepository.save(sub);
        log.info("Đăng ký Web Push cho user={}, endpoint={}...", username,
                endpoint.substring(0, Math.min(60, endpoint.length())));
    }

    /** true nếu endpoint là https:// và host thuộc (hoặc là subdomain của) 1 push service đã biết. */
    private boolean isAllowedPushEndpoint(String endpoint) {
        if (endpoint == null || endpoint.isBlank()) return false;
        try {
            java.net.URI uri = java.net.URI.create(endpoint);
            if (!"https".equalsIgnoreCase(uri.getScheme())) return false;
            String host = uri.getHost();
            if (host == null || host.isBlank()) return false;
            String lowerHost = host.toLowerCase();
            return ALLOWED_PUSH_ENDPOINT_HOSTS.stream().anyMatch(allowed ->
                    lowerHost.equals(allowed) || lowerHost.endsWith("." + allowed));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Hủy đăng ký — CHỈ xóa subscription thuộc về đúng user đang gọi (deleteByUsernameAndEndpoint),
     * KHÔNG dùng deleteByEndpoint(endpoint) trần: nếu chỉ lọc theo endpoint, bất kỳ user nào đã
     * đăng nhập (dù không sở hữu subscription đó) mà biết/đoán được endpoint của người khác đều
     * có thể xóa subscription của họ (IDOR/broken access control) — dù endpoint khó đoán, đây vẫn
     * là kiểm soát truy cập cần có ở tầng server, không nên chỉ dựa vào endpoint là "bí mật".
     */
    @Transactional
    public void unsubscribe(String username, String endpoint) {
        pushSubscriptionRepository.deleteByUsernameAndEndpoint(username, endpoint);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GỬI PUSH
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Gửi push tới TẤT CẢ thiết bị/trình duyệt đã đăng ký của một username.
     * Best-effort tuyệt đối: KHÔNG được ném exception ra ngoài (caller là NotificationService
     * không được vỡ luồng chính vì push lỗi/VAPID chưa cấu hình).
     */
    public void sendPushToUser(String username, String title, String body, String url) {
        if (pushService == null || username == null) return;
        List<PushSubscription> subs;
        try {
            subs = pushSubscriptionRepository.findByUsername(username);
        } catch (Exception e) {
            log.warn("Không thể tải danh sách push subscription của user {}: {}", username, e.getMessage());
            return;
        }
        if (subs.isEmpty()) return;
        String payload = buildPayload(title, body, url);
        for (PushSubscription sub : subs) {
            sendToOne(sub, payload);
        }
    }

    /** Gửi push tới TOÀN BỘ subscription trong hệ thống — dùng cho broadcast. */
    public void sendBroadcastPush(String title, String body, String url) {
        if (pushService == null) return;
        List<PushSubscription> all;
        try {
            all = pushSubscriptionRepository.findAll();
        } catch (Exception e) {
            log.warn("Không thể tải danh sách push subscription để broadcast: {}", e.getMessage());
            return;
        }
        if (all.isEmpty()) return;
        String payload = buildPayload(title, body, url);
        for (PushSubscription sub : all) {
            sendToOne(sub, payload);
        }
    }

    /** Gửi tới đúng 1 subscription — lỗi của 1 subscription không được chặn các subscription khác. */
    private void sendToOne(PushSubscription sub, String payloadJson) {
        try {
            Subscription subscription = new Subscription(sub.getEndpoint(),
                    new Subscription.Keys(sub.getP256dh(), sub.getAuth()));
            Notification notification = new Notification(subscription, payloadJson);
            HttpResponse response = pushService.send(notification, Encoding.AES128GCM);
            int status = response.getStatusLine().getStatusCode();
            try {
                EntityUtils.consume(response.getEntity());
            } catch (IOException ignored) {
                // chỉ để giải phóng connection về pool, không quan trọng nếu lỗi
            }
            if (status == 404 || status == 410) {
                // Subscription hết hạn/không còn tồn tại phía trình duyệt → dọn rác
                pushSubscriptionRepository.deleteByEndpoint(sub.getEndpoint());
                log.info("Push subscription hết hạn (status={}), đã xóa endpoint={}...", status,
                        sub.getEndpoint().substring(0, Math.min(60, sub.getEndpoint().length())));
            } else if (status >= 300) {
                log.warn("Gửi push thất bại (status={}) tới endpoint={}...", status,
                        sub.getEndpoint().substring(0, Math.min(60, sub.getEndpoint().length())));
            }
        } catch (Exception e) {
            log.warn("Lỗi khi gửi push tới endpoint={}...: {}",
                    sub.getEndpoint().substring(0, Math.min(60, sub.getEndpoint().length())), e.getMessage());
        }
    }

    private String buildPayload(String title, String body, String url) {
        try {
            Map<String, String> map = new LinkedHashMap<>();
            map.put("title", title != null ? title : "");
            map.put("body", body != null ? body : "");
            map.put("url", url != null ? url : "/");
            map.put("icon", "/logo.png");
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.warn("Không thể serialize payload push, dùng fallback thô: {}", e.getMessage());
            return "{\"title\":\"" + safeJson(title) + "\",\"body\":\"" + safeJson(body) + "\",\"url\":\"/\"}";
        }
    }

    private String safeJson(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VAPID KEY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    private String[] resolveVapidKeyPair() throws Exception {
        // 1) application.properties
        if (isValidVapidPair(configuredPublicKey, configuredPrivateKey)) {
            log.info("Dùng cặp khóa VAPID cấu hình sẵn trong application.properties");
            return new String[]{configuredPublicKey.trim(), configuredPrivateKey.trim()};
        }

        // 2) File đã lưu từ lần sinh trước — LƯU Ý: cố tình dùng secureDataPath (KHÔNG PHẢI
        //    uploadBasePath) vì thư mục upload bị serve công khai qua GET /uploads/** (xem
        //    WebConfig.java) — không được đặt bất kỳ khóa bí mật nào trong đó.
        Path keyFile = Paths.get(secureDataPath, "vapid-keys.properties");
        if (Files.exists(keyFile)) {
            Properties props = new Properties();
            try (InputStream in = Files.newInputStream(keyFile)) {
                props.load(in);
            }
            String pub = props.getProperty("publicKey");
            String priv = props.getProperty("privateKey");
            if (isValidVapidPair(pub, priv)) {
                log.info("Dùng cặp khóa VAPID đã lưu tại {}", keyFile.toAbsolutePath());
                return new String[]{pub.trim(), priv.trim()};
            }
            log.warn("File {} tồn tại nhưng nội dung không hợp lệ, sẽ sinh cặp khóa mới", keyFile.toAbsolutePath());
        }

        // 3) Sinh mới + lưu lại để các lần khởi động sau tái sử dụng đúng cặp khóa này
        log.info("Chưa có cặp khóa VAPID hợp lệ — tự sinh mới (EC secp256r1)");
        String[] generated = generateVapidKeyPair();
        saveVapidKeyPair(keyFile, generated[0], generated[1]);
        return generated;
    }

    /** Kiểm tra cặp khóa có đúng định dạng VAPID không (public 65 byte 0x04-prefix, private 32 byte). */
    private boolean isValidVapidPair(String pub, String priv) {
        if (pub == null || priv == null || pub.isBlank() || priv.isBlank()) return false;
        try {
            byte[] pubBytes = Base64.getUrlDecoder().decode(pub.trim());
            byte[] privBytes = Base64.getUrlDecoder().decode(priv.trim());
            return pubBytes.length == 65 && pubBytes[0] == 0x04 && privBytes.length == 32;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Sinh cặp khóa EC (curve secp256r1/prime256v1) bằng BouncyCastle, encode base64url
     * không padding — đúng định dạng applicationServerKey mà PushManager.subscribe() cần
     * (public key = 65 byte uncompressed EC point, bắt đầu bằng 0x04).
     */
    private String[] generateVapidKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("ECDH", BouncyCastleProvider.PROVIDER_NAME);
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        KeyPair keyPair = generator.generateKeyPair();

        org.bouncycastle.jce.interfaces.ECPublicKey publicKey =
                (org.bouncycastle.jce.interfaces.ECPublicKey) keyPair.getPublic();
        org.bouncycastle.jce.interfaces.ECPrivateKey privateKey =
                (org.bouncycastle.jce.interfaces.ECPrivateKey) keyPair.getPrivate();

        byte[] publicBytes = publicKey.getQ().getEncoded(false); // 65 byte, uncompressed (0x04 || X || Y)
        byte[] privateBytes = toFixedLength(privateKey.getD().toByteArray(), 32);

        String pub = Base64.getUrlEncoder().withoutPadding().encodeToString(publicBytes);
        String priv = Base64.getUrlEncoder().withoutPadding().encodeToString(privateBytes);
        return new String[]{pub, priv};
    }

    /** Chuẩn hóa BigInteger.toByteArray() (có thể thừa/thiếu byte so với độ dài cố định) về đúng N byte. */
    private static byte[] toFixedLength(byte[] array, int length) {
        if (array.length == length) return array;
        byte[] result = new byte[length];
        if (array.length > length) {
            // BigInteger.toByteArray() có thể thêm 1 byte 0x00 ở đầu để biểu thị số dương — bỏ đi
            System.arraycopy(array, array.length - length, result, 0, length);
        } else {
            System.arraycopy(array, 0, result, length - array.length, array.length);
        }
        return result;
    }

    private void saveVapidKeyPair(Path keyFile, String pub, String priv) {
        try {
            if (keyFile.getParent() != null) {
                Files.createDirectories(keyFile.getParent());
            }
            Properties props = new Properties();
            props.setProperty("publicKey", pub);
            props.setProperty("privateKey", priv);
            try (OutputStream out = Files.newOutputStream(keyFile)) {
                props.store(out, "VAPID key pair tu sinh cho Web Push - KHONG XOA/SUA, se lam hong subscription cu");
            }
            log.info("Đã lưu cặp khóa VAPID mới vào {}", keyFile.toAbsolutePath());
        } catch (IOException e) {
            log.error("Không thể lưu cặp khóa VAPID vào file {} — key sẽ bị sinh lại mỗi lần khởi động cho tới khi ghi được!",
                    keyFile.toAbsolutePath(), e);
        }
    }
}
