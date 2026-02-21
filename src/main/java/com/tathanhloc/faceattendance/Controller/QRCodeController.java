package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Service.QRCodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST API Controller cho QR Code utilities
 */
@RestController
@RequestMapping("/api/qrcode")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "QR Code", description = "API tiện ích QR Code")
public class QRCodeController {

    private final QRCodeService qrCodeService;

    @GetMapping("/generate")
    @Operation(summary = "Sinh QR Code dạng Base64")
    public ResponseEntity<ApiResponse<QRCodeImageResponse>> generateQRCode(
            @RequestParam String content) {
        log.info("GET /api/qrcode/generate?content={}", content);

        try {
            String base64 = qrCodeService.generateQRCodeBase64(content);

            QRCodeImageResponse response = QRCodeImageResponse.builder()
                    .maQR(content)
                    .base64Image(base64)
                    .mimeType("image/png")
                    .width(300)
                    .height(300)
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Error generating QR code", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi sinh QR code: " + e.getMessage()));
        }
    }

    @GetMapping("/validate-format")
    @Operation(summary = "Validate format mã QR")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateFormat(
            @RequestParam String maQR) {
        log.info("GET /api/qrcode/validate-format?maQR={}", maQR);

        boolean isValid = qrCodeService.validateQRFormat(maQR);
        Map<String, Object> result = new HashMap<>();
        result.put("valid", isValid);

        if (isValid) {
            result.putAll(qrCodeService.parseQRCode(maQR));
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/parse")
    @Operation(summary = "Parse thông tin từ mã QR")
    public ResponseEntity<ApiResponse<Map<String, String>>> parseQRCode(
            @RequestParam String maQR) {
        log.info("GET /api/qrcode/parse?maQR={}", maQR);
        Map<String, String> info = qrCodeService.parseQRCode(maQR);
        return ResponseEntity.ok(ApiResponse.success(info));
    }
}