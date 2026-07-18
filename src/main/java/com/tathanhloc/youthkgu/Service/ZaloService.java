package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Enum.TrangThaiTinTuc;
import com.tathanhloc.youthkgu.Model.HoatDong;
import com.tathanhloc.youthkgu.Model.SinhVien;
import com.tathanhloc.youthkgu.Repository.SinhVienRepository;
import com.tathanhloc.youthkgu.Repository.TinTucRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class ZaloService {

    private final RestTemplate restTemplate;
    private final SinhVienRepository sinhVienRepository;
    private final TinTucRepository tinTucRepository;

    @Value("${zalo.oa-access-token}")
    private String oaAccessTokenConfig;

    @Value("${zalo.oa-refresh-token}")
    private String oaRefreshTokenConfig;

    @Value("${zalo.app-id}")
    private String appId;

    @Value("${zalo.app-secret}")
    private String appSecret;

    @Value("${zalo.api-url:https://openapi.zalo.me}")
    private String apiUrl;

    @Value("${zalo.mini-app-id}")
    private String miniAppId;

    // Token runtime — tự cập nhật khi refresh, không cần restart server
    private final AtomicReference<String> currentAccessToken = new AtomicReference<>();
    private final AtomicReference<String> currentRefreshToken = new AtomicReference<>();
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    @jakarta.annotation.PostConstruct
    public void init() {
        currentAccessToken.set(oaAccessTokenConfig);
        currentRefreshToken.set(oaRefreshTokenConfig);
        tokenExpiresAt = Instant.now().plusSeconds(90000);
    }

    public void updateTokens(String accessToken, String refreshToken) {
        currentAccessToken.set(accessToken);
        if (refreshToken != null && !refreshToken.isBlank()) currentRefreshToken.set(refreshToken);
        tokenExpiresAt = Instant.now().plusSeconds(86400); // 24h
        log.info("Zalo OA tokens updated via OAuth callback");
    }

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ── Liên kết MSSV ↔ Zalo User ID ────────────────────────────────────────
    public boolean linkZaloUser(String zaloUserId, String maSv) {
        return sinhVienRepository.findById(maSv).map(sv -> {
            sv.setZaloUserId(zaloUserId);
            sinhVienRepository.save(sv);
            log.info("Linked zaloUserId={} to maSv={}", zaloUserId, maSv);
            return true;
        }).orElse(false);
    }

    public Optional<com.tathanhloc.youthkgu.Model.SinhVien> findByMaSv(String maSv) {
        return sinhVienRepository.findById(maSv);
    }

    public void unlinkZaloUser(String zaloUserId) {
        sinhVienRepository.findByZaloUserId(zaloUserId).ifPresent(sv -> {
            sv.setZaloUserId(null);
            sinhVienRepository.save(sv);
            log.info("Unlinked zaloUserId={} from maSv={}", zaloUserId, sv.getMaSv());
        });
    }

    public void unlinkBySv(String maSv) {
        sinhVienRepository.findById(maSv).ifPresent(sv -> {
            sv.setZaloUserId(null);
            sinhVienRepository.save(sv);
            log.info("Unlinked zalo from maSv={} by admin", maSv);
        });
    }

    // ── Gửi text message + trả về full response (dùng cho debug) ────────────
    public Map<String, Object> sendTextMessageWithDetail(String zaloUserId, String text) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("recipient", Map.of("user_id", zaloUserId));
            body.put("message", Map.of("text", text));
            ResponseEntity<Map> resp = post("/v2.0/oa/message", body);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("httpStatus", resp.getStatusCode().value());
            result.put("zaloResponse", resp.getBody());
            result.put("success", resp.getStatusCode().is2xxSuccessful()
                    && resp.getBody() != null
                    && Integer.valueOf(0).equals(resp.getBody().get("error")));
            return result;
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    // ── Gửi text message ─────────────────────────────────────────────────────
    public boolean sendTextMessage(String zaloUserId, String text) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("recipient", Map.of("user_id", zaloUserId));
            body.put("message", Map.of("text", text));

            ResponseEntity<Map> resp = post("/v2.0/oa/message", body);
            boolean ok = resp.getStatusCode().is2xxSuccessful()
                    && resp.getBody() != null
                    && Integer.valueOf(0).equals(resp.getBody().get("error"));
            if (!ok) log.warn("Zalo send failed to {}: {}", zaloUserId, resp.getBody());
            return ok;
        } catch (Exception e) {
            log.error("Zalo sendTextMessage error to {}: {}", zaloUserId, e.getMessage());
            return false;
        }
    }

    // ── Gửi thông báo hoạt động ──────────────────────────────────────────────
    @Async
    public void sendHoatDongNotification(String zaloUserId, String hoTen, HoatDong hd) {
        String text = buildHoatDongText(hoTen, hd);
        sendTextMessage(zaloUserId, text);
    }

    @Async
    public void sendBulkHoatDongNotification(List<SinhVien> sinhViens, HoatDong hd) {
        List<SinhVien> coZalo = sinhViens.stream()
                .filter(sv -> sv.getZaloUserId() != null && !sv.getZaloUserId().isBlank())
                .toList();

        if (coZalo.isEmpty()) {
            log.info("Zalo: không có sinh viên nào đã liên kết Zalo cho HĐ '{}'", hd.getTenHoatDong());
            return;
        }

        log.info("Zalo: bắt đầu gửi thông báo HĐ '{}' cho {} SV", hd.getTenHoatDong(), coZalo.size());
        int sent = 0, failed = 0;
        for (SinhVien sv : coZalo) {
            try {
                String text = buildHoatDongText(sv.getHoTen(), hd);
                if (sendTextMessage(sv.getZaloUserId(), text)) sent++;
                else failed++;
                Thread.sleep(100); // tránh rate limit
            } catch (Exception e) {
                log.warn("Zalo: lỗi gửi cho {} - {}", sv.getMaSv(), e.getMessage());
                failed++;
            }
        }
        log.info("Zalo: HĐ '{}' — gửi OK: {}, lỗi: {}", hd.getTenHoatDong(), sent, failed);
    }

    // ── Gửi broadcast tới TẤT CẢ followers của OA ──────────────────────────
    public Map<String, Object> sendBroadcastMessage(String text) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("recipient", Map.of("target", "all"));
            body.put("message", Map.of("text", text));
            ResponseEntity<Map> resp = post("/v2.0/oa/message/broadcast", body);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("httpStatus", resp.getStatusCode().value());
            result.put("zaloResponse", resp.getBody());
            result.put("success", resp.getStatusCode().is2xxSuccessful()
                    && resp.getBody() != null
                    && Integer.valueOf(0).equals(resp.getBody().get("error")));
            return result;
        } catch (Exception e) {
            log.error("Zalo broadcast error: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    // ── Gửi link bài tin tức ─────────────────────────────────────────────────
    @Async
    public void sendNewsNotification(List<SinhVien> sinhViens, Long newsId, String tieuDe, String tomTat) {
        List<SinhVien> coZalo = sinhViens.stream()
                .filter(sv -> sv.getZaloUserId() != null && !sv.getZaloUserId().isBlank())
                .toList();

        if (coZalo.isEmpty()) return;

        String text = "📰 TIN TỨC MỚI\n\n"
                + tieuDe + "\n\n"
                + (tomTat != null && !tomTat.isBlank() ? tomTat.substring(0, Math.min(tomTat.length(), 120)) + "...\n\n" : "")
                + "🔗 Mở app để đọc: " + miniAppLink("news/" + newsId);

        log.info("Zalo: gửi tin tức '{}' cho {} SV", tieuDe, coZalo.size());
        int sent = 0;
        for (SinhVien sv : coZalo) {
            try {
                if (sendTextMessage(sv.getZaloUserId(), text)) sent++;
                Thread.sleep(100);
            } catch (Exception e) {
                log.warn("Zalo news: lỗi gửi cho {}: {}", sv.getMaSv(), e.getMessage());
            }
        }
        log.info("Zalo: tin tức — gửi OK: {}/{}", sent, coZalo.size());
    }

    // ── Danh sách sinh viên đã liên kết Zalo ─────────────────────────────────
    public Map<String, Object> getLinkedUsers(int page, int size, String keyword) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        var pageResult = sinhVienRepository.findLinkedZaloUsers(pageable);
        var content = pageResult.getContent().stream()
                .filter(sv -> keyword == null || keyword.isBlank()
                        || sv.getMaSv().contains(keyword)
                        || (sv.getHoTen() != null && sv.getHoTen().toLowerCase().contains(keyword.toLowerCase())))
                .map(sv -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("maSv", sv.getMaSv());
                    m.put("hoTen", sv.getHoTen());
                    m.put("zaloUserId", sv.getZaloUserId());
                    m.put("lop", sv.getLop() != null ? sv.getLop().getTenLop() : null);
                    m.put("khoa", sv.getLop() != null && sv.getLop().getMaKhoa() != null
                            ? sv.getLop().getMaKhoa().getTenKhoa() : null);
                    return m;
                }).toList();
        return Map.of(
                "content", content,
                "totalElements", pageResult.getTotalElements(),
                "totalPages", pageResult.getTotalPages(),
                "page", page
        );
    }

    // ── Thống kê ─────────────────────────────────────────────────────────────
    public Map<String, Object> getStats() {
        long total = sinhVienRepository.countByIsActiveTrue();
        long linked = sinhVienRepository.countByZaloUserIdNotNull();
        return Map.of(
                "tongSinhVien", total,
                "daLienKet", linked,
                "chuaLienKet", total - linked,
                "tiLe", total > 0 ? String.format("%.1f%%", linked * 100.0 / total) : "0%"
        );
    }

    // ── Giải mã Token Định Vị Zalo ──────────────────────────────────────────
    public Map<String, Double> decodeLocationToken(String locationToken, String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("access_token", accessToken);
            headers.set("code", locationToken);
            headers.set("secret_key", appSecret);

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://graph.zalo.me/v2.0/me/info",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (body.containsKey("data")) {
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    if (data != null && data.containsKey("latitude") && data.containsKey("longitude")) {
                        Map<String, Double> result = new java.util.HashMap<>();
                        result.put("latitude", Double.valueOf(data.get("latitude").toString()));
                        result.put("longitude", Double.valueOf(data.get("longitude").toString()));
                        return result;
                    }
                }
            }
            log.error("Failed to decode Zalo location token: {}", response.getBody());
        } catch (Exception e) {
            log.error("Exception decoding Zalo location token", e);
        }
        return null;
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    /**
     * Link mở Mini App tại 1 màn hình cụ thể (vd. "activities/KHCTSV01").
     * Bấm trong Zalo (chat/OA) sẽ mở thẳng Mini App; mở ngoài Zalo (trình duyệt) tự fallback
     * sang trang xem trước trên web của Zalo — không cần link web riêng nữa.
     */
    public String miniAppLink(String path) {
        return "https://zalo.me/s/" + miniAppId + "/" + path;
    }

    /**
     * Link web của hoạt động — ưu tiên bài tin tức đã publish liên kết với hoạt động
     * (tự tạo khi tạo hoạt động, xem HoatDongService.autoCreateNewsForActivity),
     * fallback về trang danh sách hoạt động chung nếu chưa có bài nào.
     */
    private String websiteLink(String maHoatDong) {
        return tinTucRepository
                .findFirstByHoatDongIdAndTrangThaiAndIsDeletedFalseOrderByCreatedAtDesc(maHoatDong, TrangThaiTinTuc.PUBLISHED)
                .map(t -> "https://tuoitre.vnkgu.edu.vn/" + t.getFullUrlPath())
                .orElse("https://tuoitre.vnkgu.edu.vn/hoat-dong");
    }

    private String buildHoatDongText(String hoTen, HoatDong hd) {
        StringBuilder sb = new StringBuilder();
        sb.append("🎯 THÔNG BÁO HOẠT ĐỘNG ĐOÀN\n\n");
        sb.append("Xin chào ").append(hoTen).append("!\n\n");
        sb.append("📌 ").append(hd.getTenHoatDong()).append("\n");

        if (hd.getNgayToChuc() != null) {
            sb.append("📅 Ngày: ").append(hd.getNgayToChuc().format(DATE_FMT));
            if (hd.getNgayKetThuc() != null && !hd.getNgayKetThuc().equals(hd.getNgayToChuc())) {
                sb.append(" → ").append(hd.getNgayKetThuc().format(DATE_FMT));
            }
            sb.append("\n");
        }
        if (hd.getGioToChuc() != null) {
            sb.append("⏰ Giờ: ").append(hd.getGioToChuc().format(TIME_FMT)).append("\n");
        }
        if (hd.getDiaDiem() != null && !hd.getDiaDiem().isBlank()) {
            sb.append("📍 Địa điểm: ").append(hd.getDiaDiem()).append("\n");
        }
        if (hd.getDiemRenLuyen() != null && hd.getDiemRenLuyen() > 0) {
            sb.append("⭐ Điểm rèn luyện: ").append(hd.getDiemRenLuyen()).append(" điểm\n");
        }
        if (hd.getMoTa() != null && !hd.getMoTa().isBlank()) {
            String mota = hd.getMoTa().replaceAll("<[^>]*>", "");
            sb.append("\n📝 ").append(mota, 0, Math.min(mota.length(), 150));
            if (mota.length() > 150) sb.append("...");
            sb.append("\n");
        }
        sb.append("\n🔗 Mở app để đăng ký ngay: ").append(miniAppLink("activities/" + hd.getMaHoatDong()));
        sb.append("\n🌐 Hoặc xem trên web: ").append(websiteLink(hd.getMaHoatDong()));
        return sb.toString();
    }

    private String getAccessToken() {
        // Refresh nếu còn dưới 30 phút
        if (Instant.now().isAfter(tokenExpiresAt.minusSeconds(1800))) {
            refreshAccessToken();
        }
        return currentAccessToken.get();
    }

    private synchronized void refreshAccessToken() {
        try {
            log.info("Zalo: refreshing access token...");
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("secret_key", appSecret);
            String body = "app_id=" + appId
                    + "&refresh_token=" + currentRefreshToken.get()
                    + "&grant_type=refresh_token";

            ResponseEntity<Map> resp = restTemplate.exchange(
                    "https://oauth.zaloapp.com/v4/oa/access_token",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class);

            if (resp.getBody() != null && resp.getBody().containsKey("access_token")) {
                currentAccessToken.set((String) resp.getBody().get("access_token"));
                currentRefreshToken.set((String) resp.getBody().get("refresh_token"));
                tokenExpiresAt = Instant.now().plusSeconds(90000);
                log.info("Zalo: token refreshed successfully, expires at {}", tokenExpiresAt);
            } else {
                log.error("Zalo: token refresh failed: {}", resp.getBody());
            }
        } catch (Exception e) {
            log.error("Zalo: token refresh error: {}", e.getMessage());
        }
    }

    private ResponseEntity<Map> post(String path, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("access_token", getAccessToken());
        return restTemplate.exchange(
                apiUrl + path,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
        );
    }
}
