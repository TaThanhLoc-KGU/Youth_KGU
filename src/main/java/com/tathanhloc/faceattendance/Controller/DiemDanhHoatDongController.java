package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Service.DiemDanhHoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.*;
import java.io.ByteArrayInputStream;
import java.io.IOException;

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

    @GetMapping("/activity/{maHoatDong}/export")
    @Operation(summary = "Xuất danh sách điểm danh ra file Excel")
    @PreAuthorize("hasPermission(null, 'XEM_DIEM_DANH')")
    public ResponseEntity<InputStreamResource> exportAttendance(@PathVariable String maHoatDong) throws IOException {
        log.info("GET /api/diem-danh/activity/{}/export", maHoatDong);
        ByteArrayInputStream in = diemDanhService.exportAttendanceExcel(maHoatDong);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=diem_danh_" + maHoatDong + ".xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    // ========== QR SCAN ENDPOINTS ==========

    @PostMapping("/scan")
    @Operation(summary = "⭐ Quét QR Code để điểm danh (Check-in)")
    @PreAuthorize("hasPermission(null, 'QUET_QR')")
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
    @PreAuthorize("hasPermission(null, 'QUET_QR')")
    public ResponseEntity<QRValidationResult> validateQR(
            @RequestParam String maQR,
            @RequestParam String maHoatDong) {
        log.info("GET /api/diem-danh/validate?maQR={}&maHoatDong={}", maQR, maHoatDong);
        QRValidationResult result = diemDanhService.validateQRCode(maQR, maHoatDong);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/check-out")
    @Operation(summary = "Check-out khi kết thúc (Dùng ID hoặc QR)")
    @PreAuthorize("hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<DiemDanhHoatDongDTO>> checkOut(
            @RequestBody CheckOutRequest request) {
        log.info("POST /api/diem-danh/check-out - ID: {}, QR: {}", request.getDiemDanhId(), request.getMaQR());
        DiemDanhHoatDongDTO result = diemDanhService.checkOut(request);
        return ResponseEntity.ok(ApiResponse.success("Check-out thành công", result));
    }

    // ========== QUERY ENDPOINTS ==========

    @GetMapping("/activity/{maHoatDong}")
    @Operation(summary = "Danh sách điểm danh theo hoạt động")
    @PreAuthorize("hasPermission(null, 'XEM_DIEM_DANH')")
    public ResponseEntity<ApiResponse<List<DiemDanhHoatDongDTO>>> getByActivity(
            @PathVariable String maHoatDong) {
        log.info("GET /api/diem-danh/activity/{}", maHoatDong);
        List<DiemDanhHoatDongDTO> records = diemDanhService.getByActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/activity/{maHoatDong}/checked-in")
    @Operation(summary = "Danh sách đã check-in")
    @PreAuthorize("hasPermission(null, 'XEM_DIEM_DANH')")
    public ResponseEntity<ApiResponse<List<DiemDanhHoatDongDTO>>> getCheckedIn(
            @PathVariable String maHoatDong) {
        log.info("GET /api/diem-danh/activity/{}/checked-in", maHoatDong);
        List<DiemDanhHoatDongDTO> records = diemDanhService.getCheckedInStudents(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/activity/{maHoatDong}/not-checked-in")
    @Operation(summary = "Danh sách chưa check-in")
    @PreAuthorize("hasPermission(null, 'XEM_DIEM_DANH')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNotCheckedIn(
            @PathVariable String maHoatDong) {
        log.info("GET /api/diem-danh/activity/{}/not-checked-in", maHoatDong);
        List<Map<String, Object>> records = diemDanhService.getNotCheckedInStudents(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/student/{maSv}")
    @Operation(summary = "Lịch sử điểm danh của sinh viên")
    @PreAuthorize("hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
    public ResponseEntity<ApiResponse<List<DiemDanhHoatDongDTO>>> getByStudent(
            @PathVariable String maSv) {
        log.info("GET /api/diem-danh/student/{}", maSv);
        List<DiemDanhHoatDongDTO> records = diemDanhService.getByStudent(maSv);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    // ========== ADMIN ENDPOINTS ==========

    @PostMapping("/manual")
    @Operation(summary = "Điểm danh thủ công hàng loạt (Admin/BCH)")
    @PreAuthorize("hasPermission(null, 'CHINH_SUA_DIEM_DANH')")
    public ResponseEntity<ApiResponse<Map<String, String>>> manualCheckIn(
            @RequestBody ManualCheckInRequest request) {
        log.info("POST /api/diem-danh/manual - activity={}, count={}",
                request.getMaHoatDong(), request.getMaSvList() == null ? 0 : request.getMaSvList().size());
        Map<String, String> results = diemDanhService.manualCheckInBulk(request);
        return ResponseEntity.ok(ApiResponse.success("Điểm danh thủ công hoàn tất", results));
    }

    @PostMapping("/mark-absent")
    @Operation(summary = "Đánh dấu vắng mặt (Admin)")
    @PreAuthorize("hasPermission(null, 'CHINH_SUA_DIEM_DANH')")
    public ResponseEntity<ApiResponse<Void>> markAbsent(
            @RequestBody MarkAbsentRequest request) {
        log.info("POST /api/diem-danh/mark-absent - Student: {}, Activity: {}",
                request.getMaSv(), request.getMaHoatDong());
        diemDanhService.markAbsent(request.getMaSv(), request.getMaHoatDong(), request.getGhiChu());
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu vắng mặt thành công", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa bản ghi điểm danh (Admin)")
    @PreAuthorize("hasPermission(null, 'CHINH_SUA_DIEM_DANH')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("DELETE /api/diem-danh/{}", id);
        diemDanhService.deleteAttendance(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/statistics/{maHoatDong}")
    @Operation(summary = "Thống kê điểm danh")
    @PreAuthorize("hasPermission(null, 'XEM_DIEM_DANH')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics(
            @PathVariable String maHoatDong) {
        log.info("GET /api/diem-danh/statistics/{}", maHoatDong);
        Map<String, Object> stats = diemDanhService.getAttendanceStatistics(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/statistics/student/{maSv}")
    @Operation(summary = "Thống kê tham gia của sinh viên")
    @PreAuthorize("hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentHistory(
            @PathVariable String maSv) {
        log.info("GET /api/diem-danh/statistics/student/{}", maSv);
        Map<String, Object> stats = diemDanhService.getStudentAttendanceHistory(maSv);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/statistics")
    @Operation(summary = "Thống kê điểm danh tổng hợp")
    @PreAuthorize("hasPermission(null, 'XEM_DIEM_DANH') or hasPermission(null, 'QUET_QR') or hasPermission(null, 'TAO_HOAT_DONG')")
    public ResponseEntity<ApiResponse<AttendanceStatisticsDTO>> getStatisticsOverview() {
        log.info("GET /api/diem-danh/statistics");
        AttendanceStatisticsDTO stats = diemDanhService.getAttendanceStatisticsOverview();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public void rethrowAccessDenied(org.springframework.security.access.AccessDeniedException e)
            throws org.springframework.security.access.AccessDeniedException {
        throw e;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in DiemDanhHoatDongController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}
