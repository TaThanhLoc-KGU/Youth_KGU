package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Service.DiemDanhHoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST API Controller cho điểm danh QR Code
 * CORE CONTROLLER - Xử lý quét QR
 */
@RestController
@RequestMapping("/api/diem-danh")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Điểm Danh", description = "API điểm danh QR Code")
public class DiemDanhHoatDongController {

    private final DiemDanhHoatDongService diemDanhService;

    // ========== QR SCAN ENDPOINTS ==========

    @PostMapping("/scan")
    @Operation(summary = "⭐ Quét QR Code để điểm danh")
    public ResponseEntity<DiemDanhQRResponse> scanQRCode(
            @RequestBody DiemDanhQRRequest request) {
        log.info("POST /api/diem-danh/scan - Scanning QR: {}", request.getMaQR());
        DiemDanhQRResponse response = diemDanhService.scanQRCode(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/validate")
    @Operation(summary = "Validate QR Code trước khi quét")
    public ResponseEntity<QRValidationResult> validateQR(
            @RequestParam String maQR,
            @RequestParam String maHoatDong) {
        log.info("GET /api/diem-danh/validate?maQR={}&maHoatDong={}", maQR, maHoatDong);
        QRValidationResult result = diemDanhService.validateQRCode(maQR, maHoatDong);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/check-out")
    @Operation(summary = "Check-out khi kết thúc")
    public ResponseEntity<ApiResponse<DiemDanhHoatDongDTO>> checkOut(
            @RequestBody CheckOutRequest request) {
        log.info("POST /api/diem-danh/check-out - ID: {}", request.getDiemDanhId());
        DiemDanhHoatDongDTO result = diemDanhService.checkOut(
                request.getDiemDanhId(),
                request.getMaBchXacNhan()
        );
        return ResponseEntity.ok(ApiResponse.success("Check-out thành công", result));
    }

    // ========== QUERY ENDPOINTS ==========

    @GetMapping("/activity/{maHoatDong}")
    @Operation(summary = "Danh sách điểm danh theo hoạt động")
    public ResponseEntity<ApiResponse<List<DiemDanhHoatDongDTO>>> getByActivity(
            @PathVariable String maHoatDong) {
        log.info("GET /api/diem-danh/activity/{}", maHoatDong);
        List<DiemDanhHoatDongDTO> records = diemDanhService.getByActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/activity/{maHoatDong}/checked-in")
    @Operation(summary = "Danh sách đã check-in")
    public ResponseEntity<ApiResponse<List<DiemDanhHoatDongDTO>>> getCheckedIn(
            @PathVariable String maHoatDong) {
        log.info("GET /api/diem-danh/activity/{}/checked-in", maHoatDong);
        List<DiemDanhHoatDongDTO> records = diemDanhService.getCheckedInStudents(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/activity/{maHoatDong}/not-checked-in")
    @Operation(summary = "Danh sách chưa check-in")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNotCheckedIn(
            @PathVariable String maHoatDong) {
        log.info("GET /api/diem-danh/activity/{}/not-checked-in", maHoatDong);
        List<Map<String, Object>> records = diemDanhService.getNotCheckedInStudents(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/student/{maSv}")
    @Operation(summary = "Lịch sử điểm danh của sinh viên")
    public ResponseEntity<ApiResponse<List<DiemDanhHoatDongDTO>>> getByStudent(
            @PathVariable String maSv) {
        log.info("GET /api/diem-danh/student/{}", maSv);
        List<DiemDanhHoatDongDTO> records = diemDanhService.getByStudent(maSv);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    // ========== ADMIN ENDPOINTS ==========

    @PostMapping("/mark-absent")
    @Operation(summary = "Đánh dấu vắng mặt (Admin)")
    public ResponseEntity<ApiResponse<Void>> markAbsent(
            @RequestBody MarkAbsentRequest request) {
        log.info("POST /api/diem-danh/mark-absent - Student: {}, Activity: {}",
                request.getMaSv(), request.getMaHoatDong());
        diemDanhService.markAbsent(request.getMaSv(), request.getMaHoatDong(), request.getGhiChu());
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu vắng mặt thành công", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa bản ghi điểm danh (Admin)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("DELETE /api/diem-danh/{}", id);
        diemDanhService.deleteAttendance(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/statistics/{maHoatDong}")
    @Operation(summary = "Thống kê điểm danh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics(
            @PathVariable String maHoatDong) {
        log.info("GET /api/diem-danh/statistics/{}", maHoatDong);
        Map<String, Object> stats = diemDanhService.getAttendanceStatistics(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/statistics/student/{maSv}")
    @Operation(summary = "Thống kê tham gia của sinh viên")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentHistory(
            @PathVariable String maSv) {
        log.info("GET /api/diem-danh/statistics/student/{}", maSv);
        Map<String, Object> stats = diemDanhService.getStudentAttendanceHistory(maSv);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in DiemDanhHoatDongController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}