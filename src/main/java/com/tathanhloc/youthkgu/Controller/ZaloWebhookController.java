package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.Service.ZaloService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

/**
 * Nhận sự kiện từ Zalo OA webhook.
 * URL cấu hình trên Zalo Developers: https://tuoitre.vnkgu.edu.vn/api/zalo/webhook
 */
@RestController
@RequestMapping("/api/zalo")
@RequiredArgsConstructor
@Slf4j
public class ZaloWebhookController {

    private final ZaloService zaloService;
    private final RestTemplate restTemplate;
    private final com.tathanhloc.youthkgu.Repository.SinhVienRepository sinhVienRepository;
    private final com.tathanhloc.youthkgu.Service.KhoaScopeService khoaScopeService;

    /** true nếu tài khoản hiện tại là Đoàn trường (không giới hạn theo khoa hay CLB nào). */
    private boolean isDoanTruongScope() {
        return khoaScopeService.getCurrentMaKhoa() == null && khoaScopeService.getCurrentMaClb() == null;
    }

    @Value("${zalo.webhook-verify-token:youthkgu2026}")
    private String verifyToken;

    @Value("${zalo.app-id}")
    private String appId;

    @Value("${zalo.app-secret}")
    private String appSecretKey;

    // Lưu 50 event gần nhất trong memory để debug
    private static final int MAX_EVENTS = 50;
    private static final Deque<Map<String, Object>> recentEvents = new ConcurrentLinkedDeque<>();
    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    // Lưu code_verifier tạm thời (state → verifier), tự dọn sau 10 phút
    private static final Map<String, String> pendingVerifiers = new ConcurrentHashMap<>();

    // ── Xác thực webhook (Zalo gọi 1 lần khi đăng ký) ─────────────────────
    @GetMapping("/webhook")
    public ResponseEntity<String> verify(
            @RequestParam(value = "hub.mode",         required = false) String mode,
            @RequestParam(value = "hub.challenge",    required = false) String challenge,
            @RequestParam(value = "hub.verify_token", required = false) String token) {

        log.info("Zalo webhook verify: mode={} token={}", mode, token);
        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            return ResponseEntity.ok(challenge);
        }
        // Một số phiên bản Zalo không dùng hub.* — trả về 200 OK
        return ResponseEntity.ok("OK");
    }

    // ── Nhận sự kiện từ Zalo ────────────────────────────────────────────────
    @PostMapping("/webhook")
    public ResponseEntity<String> receiveEvent(@RequestBody Map<String, Object> payload) {
        try {
            log.info("Zalo event received (full): {}", payload);
            // Chuẩn hóa: Zalo real event dùng "follower" thay vì "sender"
            normalizePayload(payload);
            logEvent(payload);

            String eventName = (String) payload.get("event_name");
            if (eventName == null) return ResponseEntity.ok("OK");

            switch (eventName) {
                case "follow" -> handleFollow(payload);
                case "unfollow" -> handleUnfollow(payload);
                case "user_send_text" -> handleTextMessage(payload);
                default -> log.debug("Zalo event ignored: {}", eventName);
            }
        } catch (Exception e) {
            log.error("Zalo webhook error: {}", e.getMessage(), e);
            logEvent(Map.of("event_name", "ERROR", "error", e.getMessage()));
        }
        return ResponseEntity.ok("OK");
    }

    // ── Debug: xem event gần nhất ────────────────────────────────────────────
    @GetMapping("/events")
    public ResponseEntity<List<Map<String, Object>>> getRecentEvents() {
        return ResponseEntity.ok(new ArrayList<>(recentEvents));
    }

    @DeleteMapping("/events")
    public ResponseEntity<String> clearEvents() {
        recentEvents.clear();
        return ResponseEntity.ok("Cleared");
    }

    private void logEvent(Map<String, Object> payload) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("time", LocalDateTime.now().format(DT_FMT));
        entry.put("event", payload.getOrDefault("event_name", "unknown"));
        entry.put("senderId", extractSenderId(payload));
        entry.put("raw", payload);
        recentEvents.addFirst(entry);
        if (recentEvents.size() > MAX_EVENTS) recentEvents.pollLast();
    }

    // ── Bắt đầu OAuth flow: tạo PKCE verifier, redirect sang Zalo ──────────
    @GetMapping("/oauth/start")
    public ResponseEntity<Void> oauthStart() throws Exception {
        // Tạo code_verifier ngẫu nhiên (43 chars)
        SecureRandom rng = new SecureRandom();
        byte[] bytes = new byte[32];
        rng.nextBytes(bytes);
        String codeVerifier = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        // code_challenge = BASE64URL(SHA256(verifier))
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
        String codeChallenge = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);

        // state = random nonce để map verifier sau callback
        String state = UUID.randomUUID().toString().replace("-", "");
        pendingVerifiers.put(state, codeVerifier);

        String redirectUri = URLEncoder.encode("https://tuoitre.vnkgu.edu.vn/api/zalo/oauth/callback", StandardCharsets.UTF_8);
        String url = "https://oauth.zaloapp.com/v4/oa/permission"
                + "?app_id=" + appId
                + "&redirect_uri=" + redirectUri
                + "&code_challenge=" + codeChallenge
                + "&state=" + state;

        log.info("Zalo OAuth start: state={}, verifier stored", state);
        return ResponseEntity.status(302).header("Location", url).build();
    }

    // ── OAuth callback — Zalo redirect về đây sau khi user cấp quyền ────────
    @GetMapping("/oauth/callback")
    public ResponseEntity<String> oauthCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        if (error != null) {
            log.error("Zalo OAuth error: {}", error);
            return ResponseEntity.ok("<html><body><h2>Lỗi: " + error + "</h2></body></html>");
        }
        if (code == null) {
            return ResponseEntity.badRequest().body("Missing code");
        }

        log.info("Zalo OAuth code received (state={}): {}", state, code);

        // Lấy verifier đã lưu khi bắt đầu flow
        String codeVerifier = state != null ? pendingVerifiers.remove(state) : null;

        if (codeVerifier == null) {
            // Không tìm thấy verifier — hiển thị code thủ công
            logEvent(Map.of("event_name", "OAUTH_CODE", "code", code,
                    "state", state != null ? state : "",
                    "note", "Không tìm thấy code_verifier. Hãy dùng /api/zalo/oauth/start để bắt đầu lại."));
            return ResponseEntity.ok("<html><body style=\"font-family:sans-serif;padding:32px\">"
                    + "<h2>&#x26A0;&#xFE0F; Kh&#xF4;ng t&#xEC;m th&#x1EA5;y code_verifier</h2>"
                    + "<p>Vui l&#xF2;ng dùng <a href=\"/api/zalo/oauth/start\">/api/zalo/oauth/start</a> &#x111;&#x1EC3; b&#x1EAF;t &#x111;&#x1EA7;u l&#x1EA1;i.</p>"
                    + "</body></html>");
        }

        // Tự động exchange code → token
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("secret_key", appSecretKey);
            String formBody = "app_id=" + appId + "&code=" + code
                    + "&code_verifier=" + codeVerifier + "&grant_type=authorization_code";

            org.springframework.web.client.RestTemplate rt = new org.springframework.web.client.RestTemplate();
            rt.setErrorHandler(new org.springframework.web.client.DefaultResponseErrorHandler() {
                @Override public boolean hasError(org.springframework.http.client.ClientHttpResponse r) { return false; }
            });
            ResponseEntity<String> resp = rt.exchange(
                    "https://oauth.zaloapp.com/v4/oa/access_token",
                    HttpMethod.POST, new HttpEntity<>(formBody, headers), String.class);

            String body2 = resp.getBody() != null ? resp.getBody() : "{}";
            log.info("Zalo token auto-exchange result: {}", body2);
            logEvent(Map.of("event_name", "TOKEN_AUTO_EXCHANGE", "result", body2));

            // Parse token để cập nhật service
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> tokenData = om.readValue(body2, Map.class);
                String accessToken = (String) tokenData.get("access_token");
                String refreshToken = (String) tokenData.get("refresh_token");
                if (accessToken != null) {
                    zaloService.updateTokens(accessToken, refreshToken != null ? refreshToken : "");
                    log.info("Zalo tokens updated successfully via auto-exchange");
                }
            } catch (Exception ex) {
                log.warn("Could not parse token response: {}", ex.getMessage());
            }

            return ResponseEntity.ok("<html><body style=\"font-family:sans-serif;padding:32px;max-width:700px\">"
                    + "<h2>&#x2705; Token &#x111;&#xE3; &#x111;&#x01B0;&#x1EE3;c c&#x1EAD;p nh&#x1EAD;t!</h2>"
                    + "<p>Access token &#x111;&#xE3; &#x111;&#x01B0;&#x1EE3;c c&#x1EAD;p nh&#x1EAD;t t&#x1EF1; &#x111;&#x1ED9;ng v&#xE0;o h&#x1EC7; th&#x1ED1;ng.</p>"
                    + "<pre style=\"background:#f0fdf4;border:1px solid #86efac;padding:12px;border-radius:8px;overflow:auto;font-size:12px\">"
                    + body2.replace("<","&lt;").replace(">","&gt;") + "</pre>"
                    + "<p><a href=\"/admin/zalo-debug\" style=\"color:#1d4ed8\">&#x2192; Xem Zalo Debug Page</a></p>"
                    + "</body></html>");
        } catch (Exception ex) {
            log.error("Auto token exchange failed: {}", ex.getMessage());
            return ResponseEntity.ok("<html><body><h2>L&#x1ED7;i: " + ex.getMessage() + "</h2></body></html>");
        }
    }

    // ── Đổi code lấy access_token + refresh_token ────────────────────────────
    @PostMapping("/exchange-token")
    public ResponseEntity<String> exchangeToken(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String codeVerifier = body.get("codeVerifier");
        if (code == null || codeVerifier == null) {
            return ResponseEntity.badRequest().body("{\"error\":\"Missing code or codeVerifier\"}");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("secret_key", appSecretKey); // secret_key là HEADER, không phải body
            String formBody = "app_id=" + appId
                    + "&code=" + code
                    + "&code_verifier=" + codeVerifier
                    + "&grant_type=authorization_code";

            org.springframework.web.client.RestTemplate rt = new org.springframework.web.client.RestTemplate();
            rt.setErrorHandler(new org.springframework.web.client.DefaultResponseErrorHandler() {
                @Override public boolean hasError(org.springframework.http.client.ClientHttpResponse r) { return false; }
            });
            // Nhận String để tránh lỗi content-type không phải application/json
            ResponseEntity<String> resp = rt.exchange(
                    "https://oauth.zaloapp.com/v4/oa/access_token",
                    HttpMethod.POST,
                    new HttpEntity<>(formBody, headers),
                    String.class);

            log.info("Zalo token exchange raw: {}", resp.getBody());
            logEvent(Map.of("event_name", "TOKEN_EXCHANGE", "result", resp.getBody() != null ? resp.getBody() : "null"));
            // Parse JSON thủ công và trả về
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(resp.getBody());
        } catch (Exception e) {
            log.error("Token exchange error: {}", e.getMessage());
            return ResponseEntity.ok("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // ── Thống kê liên kết ────────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(zaloService.getStats());
    }

    // ── Hủy liên kết theo maSv ───────────────────────────────────────────────
    @DeleteMapping("/unlink/{maSv}")
    public ResponseEntity<Map<String, Object>> unlinkBySv(@PathVariable String maSv) {
        zaloService.unlinkBySv(maSv);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Danh sách sinh viên đã liên kết Zalo ─────────────────────────────────
    @GetMapping("/linked-users")
    public ResponseEntity<?> getLinkedUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(zaloService.getLinkedUsers(page, size, keyword));
    }

    // ── Test gửi tin nhắn tới 1 user cụ thể (admin only) ────────────────────
    @PostMapping("/test-send")
    public ResponseEntity<Map<String, Object>> testSend(@RequestBody Map<String, String> body) {
        String zaloUserId = body.get("zaloUserId");
        String message = body.getOrDefault("message", "Test tu he thong Doan KGU");
        if (zaloUserId == null || zaloUserId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Missing zaloUserId"));
        }
        Map<String, Object> zaloResp = zaloService.sendTextMessageWithDetail(zaloUserId, message);
        return ResponseEntity.ok(zaloResp);
    }

    // ── Gửi broadcast tới TẤT CẢ followers ──────────────────────────────────
    @PostMapping("/broadcast")
    public ResponseEntity<Map<String, Object>> broadcast(@RequestBody Map<String, String> body) {
        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Missing message"));
        }
        Map<String, Object> result = zaloService.sendBroadcastMessage(message);
        logEvent(Map.of("event_name", "BROADCAST_SENT", "message", message, "result", result));
        return ResponseEntity.ok(result);
    }

    // ── Gửi lại tin xác nhận "Liên kết thành công" cho TẤT CẢ SV đã liên kết Zalo — dùng khi trước
    // đó gửi hàng loạt thất bại do access token hỏng (liên kết trong DB vẫn thành công, chỉ tin nhắn
    // xác nhận không tới được sinh viên) ─────────────────────────────────────
    @PostMapping("/resend-lien-ket")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasPermission(null, 'TAO_HOAT_DONG') or hasPermission(null, 'DANG_TIN_TUC') or hasPermission(null, 'QUAN_LY_VAN_BAN')")
    public ResponseEntity<Map<String, Object>> resendLienKet() {
        if (!isDoanTruongScope()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "error", "Chỉ Đoàn trường mới được gửi thông báo Zalo hàng loạt"));
        }
        List<com.tathanhloc.youthkgu.Model.SinhVien> sinhViens = sinhVienRepository.findByIsActive(true);
        long soCoZalo = sinhViens.stream()
                .filter(sv -> sv.getZaloUserId() != null && !sv.getZaloUserId().isBlank())
                .count();
        zaloService.resendLienKetConfirmation(sinhViens);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("soSinhVien", sinhViens.size());
        result.put("soCoZalo", soCoZalo);
        logEvent(Map.of("event_name", "RESEND_LIEN_KET", "soCoZalo", soCoZalo));
        return ResponseEntity.ok(result);
    }

    // ── Gửi thông báo tùy chỉnh tới các SV ĐÃ LIÊN KẾT Zalo (khác broadcast() ở trên — cái đó gửi
    // tới toàn bộ followers OA qua API broadcast của Zalo, không lọc theo dữ liệu liên kết trong hệ
    // thống) ─────────────────────────────────────────────────────────────────
    @PostMapping("/broadcast-linked")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasPermission(null, 'TAO_HOAT_DONG') or hasPermission(null, 'DANG_TIN_TUC') or hasPermission(null, 'QUAN_LY_VAN_BAN')")
    public ResponseEntity<Map<String, Object>> broadcastLinked(@RequestBody Map<String, String> body) {
        if (!isDoanTruongScope()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "error", "Chỉ Đoàn trường mới được gửi thông báo Zalo hàng loạt"));
        }
        String title = body.get("title");
        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Thiếu nội dung thông báo"));
        }
        List<com.tathanhloc.youthkgu.Model.SinhVien> sinhViens = sinhVienRepository.findByIsActive(true);
        long soCoZalo = sinhViens.stream()
                .filter(sv -> sv.getZaloUserId() != null && !sv.getZaloUserId().isBlank())
                .count();
        zaloService.sendCustomBroadcastToLinked(sinhViens, title, message);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("soSinhVien", sinhViens.size());
        result.put("soCoZalo", soCoZalo);
        logEvent(Map.of("event_name", "BROADCAST_LINKED_SENT", "title", title == null ? "" : title,
                "message", message, "soCoZalo", soCoZalo));
        return ResponseEntity.ok(result);
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    private void handleFollow(Map<String, Object> payload) {
        String zaloUserId = extractSenderId(payload);
        if (zaloUserId == null) return;
        log.info("Zalo: user {} followed OA", zaloUserId);

        // Gửi hướng dẫn liên kết tài khoản qua chat (nhận thông báo) và qua Mini App (đăng ký hoạt
        // động, điểm danh) — cùng dùng chung 1 zaloUserId nên làm 1 trong 2 bước là đã đủ liên kết,
        // hướng dẫn đủ cả 2 chỉ để chắc chắn người dùng biết cả 2 cách dùng.
        zaloService.sendTextMessage(zaloUserId,
                """
                👋 Xin chào! Chào mừng bạn đến với OA Đoàn Thanh niên KGU!

                Để nhận thông báo hoạt động Đoàn, đăng ký hoạt động và điểm danh ngay trên điện thoại, hãy liên kết tài khoản theo các bước sau:

                Bước 1: Nhắn mã số sinh viên (MSSV) của bạn ngay tại đây để nhận thông báo hoạt động, tin tức mới nhất qua Zalo.
                Ví dụ: 21072006095

                Bước 2: Truy cập Mini App để đăng ký hoạt động và điểm danh
                https://zalo.me/s/1510409350081692391/

                Bước 3: Trong Mini App, chọn mục "Cá nhân" → tab "Zalo" → bấm "Liên kết tài khoản"

                Bước 4: Nhập mã số sinh viên → bấm "Liên kết" để đăng nhập

                Làm đủ cả 2 bước (nhắn MSSV ở đây VÀ liên kết trong Mini App) để dùng được đầy đủ tính năng nhé!""");
    }

    private void handleUnfollow(Map<String, Object> payload) {
        String zaloUserId = extractSenderId(payload);
        if (zaloUserId == null) return;
        log.info("Zalo: user {} unfollowed OA", zaloUserId);
        zaloService.unlinkZaloUser(zaloUserId);
    }

    @SuppressWarnings("unchecked")
    private void handleTextMessage(Map<String, Object> payload) {
        String zaloUserId = extractSenderId(payload);
        if (zaloUserId == null) return;

        Map<String, Object> message = (Map<String, Object>) payload.get("message");
        if (message == null) return;
        String text = ((String) message.getOrDefault("text", "")).trim();
        if (text.isBlank()) return;

        log.info("Zalo: user {} sent text: {}", zaloUserId, text);

        // Kiểm tra có phải MSSV không (chỉ chứa chữ số, 8-15 ký tự)
        String replyMsg;
        if (text.matches("\\d{8,15}")) {
            boolean linked = zaloService.linkZaloUser(zaloUserId, text);
            if (linked) {
                replyMsg = zaloService.findByMaSv(text)
                        .map(zaloService::buildLienKetThanhCongText)
                        .orElse("✅ Liên kết MSSV " + text + " thành công!\n🌐 https://tuoitre.vnkgu.edu.vn/login");
            } else {
                replyMsg = "❌ Không tìm thấy MSSV " + text + " trong hệ thống.\n\n"
                        + "Vui lòng kiểm tra lại MSSV và nhắn lại.\n"
                        + "Nếu cần hỗ trợ, liên hệ BCH Đoàn trường.";
            }
        } else if (text.toLowerCase().contains("huy") || text.toLowerCase().contains("huỷ")) {
            zaloService.unlinkZaloUser(zaloUserId);
            replyMsg = "✅ Đã hủy liên kết thành công.\nBạn sẽ không nhận thông báo qua Zalo nữa.";
        } else {
            replyMsg = "📌 Để liên kết nhận thông báo, hãy nhắn MSSV của bạn.\n"
                    + "Ví dụ: 21072006095\n\nNhắn \"hủy\" để hủy liên kết.";
        }

        // Gửi reply và log kết quả ra debug page
        Map<String, Object> sendResult = zaloService.sendTextMessageWithDetail(zaloUserId, replyMsg);
        logEvent(Map.of("event_name", "REPLY_SENT", "to", zaloUserId,
                "text", text, "reply", replyMsg, "result", sendResult));
    }

    /**
     * Zalo test events dùng "follower.id", real events có thể dùng "sender.id" hoặc "follower.id".
     * Chuẩn hóa về "sender" để code còn lại không đổi.
     */
    @SuppressWarnings("unchecked")
    private void normalizePayload(Map<String, Object> payload) {
        if (!payload.containsKey("sender") && payload.containsKey("follower")) {
            payload.put("sender", payload.get("follower"));
        }
        // user_id_by_app fallback
        if (!payload.containsKey("sender") && payload.containsKey("user_id_by_app")) {
            payload.put("sender", Map.of("id", payload.get("user_id_by_app")));
        }
    }

    @SuppressWarnings("unchecked")
    private String extractSenderId(Map<String, Object> payload) {
        try {
            Map<String, Object> sender = (Map<String, Object>) payload.get("sender");
            return sender != null ? (String) sender.get("id") : null;
        } catch (Exception e) {
            return null;
        }
    }
}
