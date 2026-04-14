package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Service.DangKyHoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

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
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'DANG_KY_HOAT_DONG')")
    public ResponseEntity<ApiResponse<DangKyHoatDongDTO>> register(
            @Valid @RequestBody DangKyHoatDongRequest request) {
        log.info("POST /api/dang-ky - Student {} registering for activity {}",
                request.getMaSv(), request.getMaHoatDong());
        DangKyHoatDongDTO result = dangKyService.registerActivity(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký thành công", result));
    }

    @DeleteMapping
    @Operation(summary = "Hủy đăng ký")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'HUY_DANG_KY_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @RequestParam String maSv,
            @RequestParam String maHoatDong) {
        log.info("DELETE /api/dang-ky - Student {} cancelling activity {}", maSv, maHoatDong);
        dangKyService.cancelRegistration(maSv, maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Hủy đăng ký thành công", null));
    }

    @PostMapping("/confirm")
    @Operation(summary = "Xác nhận đăng ký (Admin)")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
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
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<List<DangKyHoatDongDTO>>> getByActivity(
            @PathVariable String maHoatDong) {
        log.info("GET /api/dang-ky/activity/{}", maHoatDong);
        List<DangKyHoatDongDTO> registrations = dangKyService.getByActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(registrations));
    }

    @GetMapping("/student/{maSv}")
    @Operation(summary = "Danh sách đăng ký của sinh viên")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'XEM_LICH_SU_THAM_GIA') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<List<DangKyHoatDongDTO>>> getByStudent(
            @PathVariable String maSv) {
        log.info("GET /api/dang-ky/student/{}", maSv);
        List<DangKyHoatDongDTO> registrations = dangKyService.getByStudent(maSv);
        return ResponseEntity.ok(ApiResponse.success(registrations));
    }

    @GetMapping("/qrcode/{maQR}")
    @Operation(summary = "Thông tin đăng ký theo QR")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<DangKyHoatDongDTO>> getByQR(@PathVariable String maQR) {
        log.info("GET /api/dang-ky/qrcode/{}", maQR);
        DangKyHoatDongDTO registration = dangKyService.getByQRCode(maQR);
        return ResponseEntity.ok(ApiResponse.success(registration));
    }

    @GetMapping("/pending/{maHoatDong}")
    @Operation(summary = "Danh sách chờ xác nhận")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<List<DangKyHoatDongDTO>>> getPending(
            @PathVariable String maHoatDong) {
        log.info("GET /api/dang-ky/pending/{}", maHoatDong);
        List<DangKyHoatDongDTO> pending = dangKyService.getPendingConfirmations(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(pending));
    }

    // ========== QR CODE ENDPOINTS ==========

    @GetMapping("/qrcode-image")
    @Operation(summary = "Lấy QR code dạng Base64")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'DANG_KY_HOAT_DONG')")
    public ResponseEntity<ApiResponse<String>> getQRCodeBase64(
            @RequestParam String maSv,
            @RequestParam String maHoatDong) {
        log.info("GET /api/dang-ky/qrcode-image?maSv={}&maHoatDong={}", maSv, maHoatDong);
        String base64 = dangKyService.getQRCodeBase64(maSv, maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(base64));
    }

    @PostMapping("/regenerate-qr/{maHoatDong}")
    @Operation(summary = "Sinh lại QR code cho hoạt động")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
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
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics(
            @PathVariable String maHoatDong) {
        log.info("GET /api/dang-ky/statistics/{}", maHoatDong);
        Map<String, Object> stats = dangKyService.getRegistrationStatistics(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/faculty-stats/{maHoatDong}")
    @Operation(summary = "Thống kê đăng ký theo khoa")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFacultyStats(
            @PathVariable String maHoatDong) {
        log.info("GET /api/dang-ky/faculty-stats/{}", maHoatDong);
        Map<String, Object> stats = dangKyService.getFacultyRegistrationStats(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ========== ALIAS ENDPOINTS FOR COMPATIBILITY ==========

    @PostMapping("/tham-gia")
    @Operation(summary = "Sinh viên đăng ký tham gia hoạt động (Alias)")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'DANG_KY_HOAT_DONG')")
    public ResponseEntity<ApiResponse<DangKyHoatDongDTO>> dangKyThamGia(@RequestBody Map<String, Object> request) {
        String maSv = (String) request.get("maSv");
        String maHoatDong = request.get("maHoatDong").toString();
        DangKyHoatDongRequest dto = DangKyHoatDongRequest.builder()
                .maSv(maSv)
                .maHoatDong(maHoatDong)
                .build();
        return register(dto);
    }

    @PostMapping("/huy")
    @Operation(summary = "Hủy đăng ký tham gia (Alias)")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'HUY_DANG_KY_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> huyDangKy(@RequestBody Map<String, Object> request) {
        String maSv = (String) request.get("maSv");
        String maHoatDong = request.get("maHoatDong").toString();
        return cancel(maSv, maHoatDong);
    }

    @GetMapping("/qr-code")
    @Operation(summary = "Lấy chuỗi mã QR để check-in (Alias)")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'DANG_KY_HOAT_DONG')")
    public ResponseEntity<ApiResponse<String>> getQrCode(
            @RequestParam String maSv,
            @RequestParam String maHoatDong) {
        // Trong logic mới, mã QR là chuỗi maHoatDong + maSv
        // Nhưng nếu cần lấy từ DB để chắc chắn:
        // String qrString = dangKyService.getQrCodeString(maSv, maHoatDong);
        // Tạm thời trả về chuỗi format chuẩn
        return ResponseEntity.ok(ApiResponse.success("Lấy mã QR thành công", maHoatDong + maSv));
    }

    /**
     * Sinh viên gửi vị trí GPS khi mở màn hình hiển thị QR code.
     * Không cần đăng nhập đặc biệt — dùng permission DANG_KY_HOAT_DONG (sinh viên đã đăng ký).
     * Vị trí này được dùng để phát hiện điểm danh hộ trong báo cáo điểm danh.
     */
    @PostMapping("/check-in-location")
    @Operation(summary = "Sinh viên gửi vị trí GPS khi hiển thị QR")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'DANG_KY_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> submitCheckInLocation(
            @RequestBody java.util.Map<String, Object> body) {
        String maQR     = (String) body.get("maQR");
        Double latitude  = body.get("latitude")  != null ? ((Number) body.get("latitude")).doubleValue()  : null;
        Double longitude = body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null;

        if (maQR == null || maQR.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("maQR không được để trống"));
        }
        log.info("POST /api/dang-ky/check-in-location - maQR={} lat={} lng={}", maQR, latitude, longitude);
        dangKyService.updateStudentLocation(maQR, latitude, longitude);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu vị trí", null));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public void rethrowAccessDenied(org.springframework.security.access.AccessDeniedException e)
            throws org.springframework.security.access.AccessDeniedException {
        throw e;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in DangKyHoatDongController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}
