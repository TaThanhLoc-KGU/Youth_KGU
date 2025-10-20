package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Service.DangKyHoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST API Controller cho đăng ký hoạt động
 */
@RestController
@RequestMapping("/api/dang-ky")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Đăng Ký", description = "API đăng ký hoạt động")
public class DangKyHoatDongController {

    private final DangKyHoatDongService dangKyService;

    // ========== ĐĂNG KÝ ENDPOINTS ==========

    @PostMapping
    @Operation(summary = "Đăng ký hoạt động")
    public ResponseEntity<ApiResponse<DangKyHoatDongDTO>> register(
            @RequestBody DangKyHoatDongRequest request) {
        log.info("POST /api/dang-ky - Student {} registering for activity {}",
                request.getMaSv(), request.getMaHoatDong());
        DangKyHoatDongDTO result = dangKyService.registerActivity(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký thành công", result));
    }

    @DeleteMapping
    @Operation(summary = "Hủy đăng ký")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @RequestParam String maSv,
            @RequestParam String maHoatDong) {
        log.info("DELETE /api/dang-ky - Student {} cancelling activity {}", maSv, maHoatDong);
        dangKyService.cancelRegistration(maSv, maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Hủy đăng ký thành công", null));
    }

    @PostMapping("/confirm")
    @Operation(summary = "Xác nhận đăng ký (Admin)")
    public ResponseEntity<ApiResponse<Void>> confirm(
            @RequestParam String maSv,
            @RequestParam String maHoatDong) {
        log.info("POST /api/dang-ky/confirm - Confirming {} for {}", maSv, maHoatDong);
        dangKyService.confirmRegistration(maSv, maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận thành công", null));
    }

    // ========== QUERY ENDPOINTS ==========

    @GetMapping("/activity/{maHoatDong}")
    @Operation(summary = "Danh sách đăng ký theo hoạt động")
    public ResponseEntity<ApiResponse<List<DangKyHoatDongDTO>>> getByActivity(
            @PathVariable String maHoatDong) {
        log.info("GET /api/dang-ky/activity/{}", maHoatDong);
        List<DangKyHoatDongDTO> registrations = dangKyService.getByActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(registrations));
    }

    @GetMapping("/student/{maSv}")
    @Operation(summary = "Danh sách đăng ký của sinh viên")
    public ResponseEntity<ApiResponse<List<DangKyHoatDongDTO>>> getByStudent(
            @PathVariable String maSv) {
        log.info("GET /api/dang-ky/student/{}", maSv);
        List<DangKyHoatDongDTO> registrations = dangKyService.getByStudent(maSv);
        return ResponseEntity.ok(ApiResponse.success(registrations));
    }

    @GetMapping("/qrcode/{maQR}")
    @Operation(summary = "Thông tin đăng ký theo QR")
    public ResponseEntity<ApiResponse<DangKyHoatDongDTO>> getByQR(@PathVariable String maQR) {
        log.info("GET /api/dang-ky/qrcode/{}", maQR);
        DangKyHoatDongDTO registration = dangKyService.getByQRCode(maQR);
        return ResponseEntity.ok(ApiResponse.success(registration));
    }

    @GetMapping("/pending/{maHoatDong}")
    @Operation(summary = "Danh sách chờ xác nhận")
    public ResponseEntity<ApiResponse<List<DangKyHoatDongDTO>>> getPending(
            @PathVariable String maHoatDong) {
        log.info("GET /api/dang-ky/pending/{}", maHoatDong);
        List<DangKyHoatDongDTO> pending = dangKyService.getPendingConfirmations(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(pending));
    }

    // ========== QR CODE ENDPOINTS ==========

    @GetMapping("/qrcode-image")
    @Operation(summary = "Lấy QR code dạng Base64")
    public ResponseEntity<ApiResponse<String>> getQRCodeBase64(
            @RequestParam String maSv,
            @RequestParam String maHoatDong) {
        log.info("GET /api/dang-ky/qrcode-image?maSv={}&maHoatDong={}", maSv, maHoatDong);
        String base64 = dangKyService.getQRCodeBase64(maSv, maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(base64));
    }

    @PostMapping("/regenerate-qr/{maHoatDong}")
    @Operation(summary = "Sinh lại QR code cho hoạt động")
    public ResponseEntity<ApiResponse<BulkQRResponse>> regenerateQR(
            @PathVariable String maHoatDong) {
        log.info("POST /api/dang-ky/regenerate-qr/{}", maHoatDong);
        Map<String, String> results = dangKyService.regenerateQRCodes(maHoatDong);

        BulkQRResponse response = BulkQRResponse.builder()
                .totalRequested(results.size())
                .totalSuccess((int) results.values().stream().filter(v -> !v.startsWith("ERROR")).count())
                .totalFailed((int) results.values().stream().filter(v -> v.startsWith("ERROR")).count())
                .results(results)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/statistics/{maHoatDong}")
    @Operation(summary = "Thống kê đăng ký")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics(
            @PathVariable String maHoatDong) {
        log.info("GET /api/dang-ky/statistics/{}", maHoatDong);
        Map<String, Object> stats = dangKyService.getRegistrationStatistics(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in DangKyHoatDongController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}
