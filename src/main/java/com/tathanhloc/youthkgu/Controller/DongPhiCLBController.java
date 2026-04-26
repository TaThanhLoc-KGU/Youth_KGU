package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.DongPhiCLBDTO;
import com.tathanhloc.youthkgu.Service.DongPhiCLBService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clb")
@RequiredArgsConstructor
@Slf4j
public class DongPhiCLBController {

    private final DongPhiCLBService dongPhiService;

    // ── Danh sách phí ──────────────────────────────────────────────────────────

    @GetMapping("/{maClb}/phi")
    @PreAuthorize("hasPermission(null,'QUAN_LY_PHI_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<List<DongPhiCLBDTO>>> getPhiByClb(
            @PathVariable String maClb,
            @RequestParam(required = false) String maHocKy) {
        return ResponseEntity.ok(ApiResponse.success(dongPhiService.getByClb(maClb, maHocKy)));
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
            @RequestParam(defaultValue = "50000") BigDecimal soTien,
            Authentication auth) {
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
    @PostMapping("/webhook/sepay")
    public ResponseEntity<Map<String, Object>> webhookSePay(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> payload) {
        log.info("Webhook SePay nhận: {}", payload);
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
                log.info("SePay: Đã tự động đánh dấu đóng phí cho MSSV {}", result.getMaSv());
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Lỗi xử lý webhook SePay", e);
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
