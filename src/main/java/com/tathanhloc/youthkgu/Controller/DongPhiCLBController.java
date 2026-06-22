package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.DongPhiCLBDTO;
import com.tathanhloc.youthkgu.Model.ClbCauHinh;
import com.tathanhloc.youthkgu.Repository.ClbCauHinhRepository;
import com.tathanhloc.youthkgu.Service.DongPhiCLBService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import vn.payos.model.webhooks.WebhookData;

@RestController
@RequestMapping("/api/clb")
@RequiredArgsConstructor
@Slf4j
public class DongPhiCLBController {

    private final DongPhiCLBService dongPhiService;
    private final ClbCauHinhRepository cauHinhRepo;

    @Value("${sepay.api-key:}") private String sepayApiKey;
    // Fallback toàn cục nếu CLB không tự cấu hình bank
    @Value("${sepay.bank-code:}") private String globalBankCode;
    @Value("${sepay.account-number:}") private String globalAccountNumber;
    @Value("${sepay.account-holder:}") private String globalAccountHolder;

    // ── Danh sách phí ──────────────────────────────────────────────────────────

    @GetMapping("/{maClb}/phi")
    @PreAuthorize("hasPermission(null,'QUAN_LY_PHI_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<List<DongPhiCLBDTO>>> getPhiByClb(
            @PathVariable String maClb,
            @RequestParam(required = false) String maHocKy) {
        return ResponseEntity.ok(ApiResponse.success(dongPhiService.getByClb(maClb, maHocKy)));
    }

    @GetMapping("/phi/my-fees")
    @Operation(summary = "Lấy danh sách các khoản phí của sinh viên hiện tại")
    public ResponseEntity<ApiResponse<List<DongPhiCLBDTO>>> getMyFees(Authentication auth) {
        log.info("GET /api/clb/phi/my-fees - user={}", auth.getName());
        return ResponseEntity.ok(ApiResponse.success(dongPhiService.getByStudent(auth.getName())));
    }

    // ── Thống kê ───────────────────────────────────────────────────────────────

    @GetMapping("/{maClb}/phi/stats")
    @PreAuthorize("hasPermission(null,'QUAN_LY_PHI_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
            @PathVariable String maClb,
            @RequestParam(required = false) String maHocKy) {
        return ResponseEntity.ok(ApiResponse.success(dongPhiService.getStats(maClb, maHocKy)));
    }

    // ── Sinh phí hàng loạt cho học kỳ ─────────────────────────────────────────

    @PostMapping("/{maClb}/phi/generate")
    @PreAuthorize("hasPermission(null,'QUAN_LY_PHI_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generatePhi(
            @PathVariable String maClb,
            @RequestParam String maHocKy,
            @RequestParam(required = false) BigDecimal soTien,
            Authentication auth) {
        // Ưu tiên lấy từ cấu hình CLB, fallback về tham số truyền vào, cuối cùng mặc định 50000
        if (soTien == null || soTien.compareTo(BigDecimal.ZERO) <= 0) {
            ClbCauHinh cfg = cauHinhRepo.findById(maClb).orElse(null);
            soTien = (cfg != null && cfg.getSoTienPhiKy() != null && cfg.getSoTienPhiKy().compareTo(BigDecimal.ZERO) > 0)
                    ? cfg.getSoTienPhiKy()
                    : new BigDecimal("50000");
        }
        int count = dongPhiService.generatePhiForHocKy(maClb, maHocKy, soTien, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(
                "Đã tạo " + count + " bản ghi phí",
                Map.of("created", count)));
    }

    // ── Cập nhật thủ công ──────────────────────────────────────────────────────

    @PutMapping("/{maClb}/phi/{id}/da-dong")
    @PreAuthorize("hasPermission(null,'QUAN_LY_PHI_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<DongPhiCLBDTO>> markDaDong(
            @PathVariable String maClb,
            @PathVariable Long id,
            @RequestParam(defaultValue = "TIEN_MAT") String hinhThuc,
            @RequestParam(required = false) String ghiChu,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã cập nhật đóng phí",
                dongPhiService.markDaDong(id, hinhThuc, ghiChu, auth.getName())));
    }

    @PutMapping("/{maClb}/phi/{id}/mien-giam")
    @PreAuthorize("hasPermission(null,'QUAN_LY_PHI_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<DongPhiCLBDTO>> markMienGiam(
            @PathVariable String maClb,
            @PathVariable Long id,
            @RequestParam(required = false) String ghiChu,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã cập nhật miễn giảm",
                dongPhiService.markMienGiam(id, ghiChu, auth.getName())));
    }

    @PutMapping("/{maClb}/phi/{id}/reset")
    @PreAuthorize("hasPermission(null,'QUAN_LY_PHI_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<DongPhiCLBDTO>> resetChuaDong(
            @PathVariable String maClb,
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã đặt lại chưa đóng",
                dongPhiService.resetChuaDong(id, auth.getName())));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // WEBHOOK — Casso / SePay gọi vào đây khi có giao dịch mới
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Endpoint nhận webhook từ Casso (https://casso.vn).
     * Casso POST dữ liệu dạng:
     * {
     *   "id": "gd-12345",
     *   "description": "PHICLB CLB001 2100001",
     *   "amount": 30000,
     *   "when": "2025-09-15 10:23:00",
     *   "bankSubAccId": "..."
     * }
     */
    @GetMapping("/webhook/casso")
    public ResponseEntity<String> testWebhookCasso() {
        return ResponseEntity.ok("Casso Webhook is alive! Use POST to send data.");
    }

    @PostMapping("/webhook/casso")
    public ResponseEntity<Map<String, Object>> webhookCasso(
            @RequestHeader(value = "Secure-Token", required = false) String token,
            @RequestBody Map<String, Object> payload) {
        log.info("Webhook Casso nhận: {}", payload);
        // TODO: Verify token với clb_payment_config.webhook_secret nếu cần
        try {
            String txId    = String.valueOf(payload.get("id"));
            String noiDung = String.valueOf(payload.getOrDefault("description", ""));
            Object amtObj  = payload.get("amount");
            BigDecimal soTien = amtObj != null
                    ? new BigDecimal(amtObj.toString()) : BigDecimal.ZERO;

            DongPhiCLBDTO result = dongPhiService.processWebhookTransaction(txId, noiDung, soTien, "CASSO");
            if (result != null) {
                log.info("Casso: Đã tự động đánh dấu đóng phí cho MSSV {}", result.getMaSv());
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Lỗi xử lý webhook Casso", e);
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Endpoint nhận webhook từ SePay (https://sepay.vn).
     * SePay POST dạng:
     * {
     *   "id": "SP-9876",
     *   "content": "CLB001 2100001 PHI KY 1",
     *   "transferAmount": 30000,
     *   "transferType": "in"
     * }
     */
    @GetMapping("/webhook/sepay")
    public ResponseEntity<String> testWebhookSePay() {
        return ResponseEntity.ok("SePay Webhook is alive! Use POST to send data.");
    }

    @PostMapping("/webhook/sepay")
    public ResponseEntity<Map<String, Object>> webhookSePay(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> payload) {
        log.info("Webhook SePay nhận: {}", payload);

        // Verify token: SePay gửi "Apikey <token>" trong header Authorization
        if (sepayApiKey != null && !sepayApiKey.isBlank()) {
            String expected = "Apikey " + sepayApiKey;
            if (!expected.equals(authHeader)) {
                log.warn("Webhook SePay: sai token, bỏ qua");
                return ResponseEntity.ok(Map.of("success", false, "error", "unauthorized"));
            }
        }

        try {
            // Chỉ xử lý tiền vào
            if (!"in".equals(payload.get("transferType"))) {
                return ResponseEntity.ok(Map.of("success", true, "skipped", "outgoing"));
            }
            String txId    = String.valueOf(payload.get("id"));
            String noiDung = String.valueOf(payload.getOrDefault("content", ""));
            Object amtObj  = payload.get("transferAmount");
            BigDecimal soTien = amtObj != null
                    ? new BigDecimal(amtObj.toString()) : BigDecimal.ZERO;

            DongPhiCLBDTO result = dongPhiService.processWebhookTransaction(txId, noiDung, soTien, "SEPAY");
            if (result != null) {
                log.info("SePay: Tự động đóng phí {} – MSSV {}", result.getId(), result.getMaSv());
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Lỗi xử lý webhook SePay", e);
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /** Trả về thông tin thanh toán (số TK, nội dung CK, QR URL) cho 1 bản ghi phí.
     *  Ưu tiên cấu hình riêng của CLB (clb_cau_hinh), fallback về config toàn cục. */
    @GetMapping("/{maClb}/phi/{id}/payment-info")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentInfo(
            @PathVariable String maClb, @PathVariable Long id) {
        DongPhiCLBDTO phi = dongPhiService.getById(id);
        ClbCauHinh cfg = cauHinhRepo.findById(maClb).orElse(null);

        // ── Bank info: CLB config > global fallback ──────────────
        String bankCode     = nonBlank(cfg != null ? cfg.getBankName()     : null, globalBankCode);
        String accountNumber= nonBlank(cfg != null ? cfg.getBankAccountNo(): null, globalAccountNumber);
        String accountHolder= nonBlank(cfg != null ? cfg.getAccountName()  : null, globalAccountHolder);
        // Prefix nội dung CK: do BCN tự cấu hình, nếu chưa thì mặc định "PHI"
        String prefix       = nonBlank(cfg != null ? cfg.getMaXacThucCk()  : null, "PHI");
        String noiDungCk    = prefix + phi.getMaSv();

        boolean hasBank   = accountNumber != null && !accountNumber.isBlank();
        boolean hasPayOS  = cfg != null
                && cfg.getPayosClientId() != null && !cfg.getPayosClientId().isBlank();

        // ── VietQR (hoạt động với mọi ngân hàng Việt) ────────────
        String qrUrl = null;
        if (hasBank) {
            qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                bankCode, accountNumber,
                phi.getSoTien() != null ? phi.getSoTien().toPlainString() : "0",
                java.net.URLEncoder.encode(noiDungCk, java.nio.charset.StandardCharsets.UTF_8),
                java.net.URLEncoder.encode(accountHolder != null ? accountHolder : "", java.nio.charset.StandardCharsets.UTF_8));
        }

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("maSv",          phi.getMaSv());
        info.put("tenSv",         phi.getHoTen());
        info.put("soTien",        phi.getSoTien());
        info.put("trangThai",     phi.getTrangThai());
        info.put("maReference",   phi.getMaReference());
        info.put("noiDungCk",     noiDungCk);
        info.put("bankCode",      bankCode);
        info.put("accountNumber", accountNumber);
        info.put("accountHolder", accountHolder);
        info.put("hasBank",       hasBank);
        info.put("hasPayOS",      hasPayOS);
        info.put("qrUrl",         qrUrl);
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    private static String nonBlank(String primary, String fallback) {
        return (primary != null && !primary.isBlank()) ? primary : fallback;
    }

    /**
     * Endpoint nhận webhook từ PayOS.
     * Vì mỗi CLB có 1 PayOS riêng, ta thêm {maClb} vào URL để biết CLB nào đang gọi webhook,
     * từ đó lấy đúng Checksum Key để verify.
     */
    @PostMapping("/webhook/payos/{maClb}")
    public ResponseEntity<Map<String, Object>> webhookPayOS(
            @PathVariable String maClb,
            @RequestBody Object payload) {
        log.info("Webhook PayOS nhận cho CLB {}: {}", maClb, payload);
        try {
            DongPhiCLBDTO result = dongPhiService.processPayOSWebhook(maClb, payload);
            if (result != null) {
                log.info("PayOS: Đã tự động đánh dấu đóng phí cho MSSV {}", result.getMaSv());
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Lỗi xử lý webhook PayOS cho CLB {}", maClb, e);
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // ── Tạo link thanh toán PayOS ──────────────────────────────────────────────
    @PostMapping("/{maClb}/phi/{id}/payos-link")
    @PreAuthorize("hasPermission(null,'QUAN_LY_PHI_CLB') or hasPermission(null,'QUAN_LY_CLB') or isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPayOSLink(
            @PathVariable String maClb,
            @PathVariable Long id,
            @RequestParam String returnUrl,
            @RequestParam String cancelUrl) {
        String checkoutUrl = dongPhiService.createPayOSPaymentLink(id, returnUrl, cancelUrl);
        return ResponseEntity.ok(ApiResponse.success(
                "Tạo link thanh toán thành công",
                Map.of("checkoutUrl", checkoutUrl)
        ));
    }
}
