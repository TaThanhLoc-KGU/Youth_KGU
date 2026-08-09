package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Service.DiemDanhHoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;

import org.springframework.web.multipart.MultipartFile;
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

    // ========== SELF-SERVICE (GPS) ENDPOINTS ==========

    @GetMapping("/activity/{maHoatDong}/dynamic-qr")
    @Operation(summary = "Lấy token QR động cho điểm danh tự phục vụ (Thay đổi mỗi 30s)")
    @PreAuthorize("hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<String>> getDynamicQRToken(@PathVariable String maHoatDong) {
        log.info("GET /api/diem-danh/activity/{}/dynamic-qr", maHoatDong);
        String token = diemDanhService.getDynamicQRToken(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(token));
    }

    @PostMapping("/self-scan")
    @Operation(summary = "Sinh viên tự quét mã QR động để điểm danh kèm GPS")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<DiemDanhQRResponse> selfScanQRCode(
            @RequestBody DiemDanhSelfScanRequest request,
            Authentication authentication) {
        
        com.tathanhloc.youthkgu.Security.CustomUserDetails userDetails = 
                (com.tathanhloc.youthkgu.Security.CustomUserDetails) authentication.getPrincipal();
        String maSv = userDetails.getTaiKhoan().getSinhVien().getMaSv();
        
        log.info("POST /api/diem-danh/self-scan - Student: {}", maSv);
        
        DiemDanhQRResponse response = diemDanhService.selfScanQRCode(request, maSv);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // ========== AUTO ĐIỂM DANH (chế độ AUTO_FULL) ==========

    @PostMapping("/activity/{maHoatDong}/auto-diem-danh")
    @Operation(summary = "Tự động điểm danh toàn bộ sinh viên đăng ký (chỉ dùng cho chế độ AUTO_FULL)")
    @PreAuthorize("hasPermission(null, 'GIAO_DIEM_DANH')")
    public ResponseEntity<ApiResponse<String>> autoDiemDanh(@PathVariable String maHoatDong) {
        log.info("POST /api/diem-danh/activity/{}/auto-diem-danh", maHoatDong);
        int count = diemDanhService.autoDiemDanhAll(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã tự động điểm danh " + count + " sinh viên", String.valueOf(count)));
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
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
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

    @PostMapping("/manual-add-unregistered")
    @Operation(summary = "Bổ sung thủ công sinh viên chưa đăng ký vào hoạt động đã kết thúc (tính năng ẩn)")
    @PreAuthorize("hasPermission(null, 'CHINH_SUA_DIEM_DANH')")
    public ResponseEntity<ApiResponse<DiemDanhHoatDongDTO>> manualAddUnregistered(
            @RequestBody java.util.Map<String, String> body) {
        String maSv = body.get("maSv");
        String maHoatDong = body.get("maHoatDong");
        String ghiChu = body.get("ghiChu");
        log.info("POST /api/diem-danh/manual-add-unregistered - student={}, activity={}", maSv, maHoatDong);
        DiemDanhHoatDongDTO result = diemDanhService.manualAddUnregistered(maSv, maHoatDong, ghiChu);
        return ResponseEntity.ok(ApiResponse.success("Đã bổ sung thành công", result));
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

    @GetMapping("/activities-overview")
    @Operation(summary = "Danh sách hoạt động kèm thống kê điểm danh (dành cho trang chọn điểm danh)")
    @PreAuthorize("hasPermission(null, 'QUET_QR') or hasPermission(null, 'XEM_DIEM_DANH')")
    public ResponseEntity<ApiResponse<List<ActivityAttendanceOverviewDTO>>> getActivitiesOverview(
            @RequestParam(required = false, defaultValue = "hom_nay") String filter) {
        log.info("GET /api/diem-danh/activities-overview?filter={}", filter);
        List<ActivityAttendanceOverviewDTO> list = diemDanhService.getActivitiesForAttendance(filter);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/statistics/{maHoatDong}")
    @Operation(summary = "Thống kê điểm danh")
    @PreAuthorize("hasPermission(null, 'QUET_QR') or hasPermission(null, 'XEM_DIEM_DANH')")
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

    /**
     * POST /api/diem-danh/them-thu-cong
     * Admin thêm sinh viên vào danh sách bằng MSSV (không cần đã đăng ký trước).
     * Body: { maHoatDong, maSv, ghiChu? }
     */
    @PostMapping("/them-thu-cong")
    @Operation(summary = "Admin thêm sinh viên vào điểm danh theo MSSV")
    @PreAuthorize("hasPermission(null, 'CHINH_SUA_DIEM_DANH') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<DiemDanhHoatDongDTO>> themThuCong(
            @RequestBody Map<String, String> body,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            org.springframework.security.core.userdetails.UserDetails userDetails) {

        String maHoatDong = body.get("maHoatDong");
        String maSv       = body.get("maSv");
        String ghiChu     = body.getOrDefault("ghiChu", "");
        String nguoi      = userDetails != null ? userDetails.getUsername() : "admin";

        log.info("POST /api/diem-danh/them-thu-cong: HĐ={} SV={} bởi {}", maHoatDong, maSv, nguoi);
        DiemDanhHoatDongDTO dto = diemDanhService.themThuCongTheoMSSV(maHoatDong, maSv, ghiChu, nguoi);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm sinh viên vào danh sách", dto));
    }

    // ========== HOẠT ĐỘNG KHÔNG ĐĂNG KÝ ==========

    @PostMapping("/khong-dang-ky/{maHoatDong}/them-thu-cong")
    @Operation(summary = "Thêm sinh viên thủ công vào hoạt động không đăng ký")
    @PreAuthorize("hasPermission(null, 'DIEM_DANH') or hasPermission(null, 'QUAN_LY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> themThuCong(
            @PathVariable String maHoatDong,
            @RequestBody List<String> maSvList) throws IOException {
        log.info("POST /api/diem-danh/khong-dang-ky/{}/them-thu-cong - {} SV", maHoatDong, maSvList.size());
        Map<String, Object> result = diemDanhService.themThuCongKhongDangKy(maHoatDong, maSvList);
        return ResponseEntity.ok(ApiResponse.success("Thêm thành công", result));
    }

    @PostMapping(value = "/khong-dang-ky/{maHoatDong}/import-excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import danh sách sinh viên từ Excel (hoạt động không đăng ký)")
    @PreAuthorize("hasPermission(null, 'DIEM_DANH') or hasPermission(null, 'QUAN_LY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importExcel(
            @PathVariable String maHoatDong,
            @RequestParam("file") MultipartFile file) throws IOException {
        log.info("POST /api/diem-danh/khong-dang-ky/{}/import-excel - file: {}", maHoatDong, file.getOriginalFilename());
        Map<String, Object> result = diemDanhService.importExcelKhongDangKy(maHoatDong, file);
        return ResponseEntity.ok(ApiResponse.success("Import thành công", result));
    }

    @DeleteMapping("/khong-dang-ky/{maHoatDong}/xoa/{maSv}")
    @Operation(summary = "Xóa sinh viên khỏi danh sách tham gia (hoạt động không đăng ký)")
    @PreAuthorize("hasPermission(null, 'DIEM_DANH') or hasPermission(null, 'QUAN_LY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<Void>> xoaKhoiDanhSach(
            @PathVariable String maHoatDong,
            @PathVariable String maSv) {
        log.info("DELETE /api/diem-danh/khong-dang-ky/{}/xoa/{}", maHoatDong, maSv);
        diemDanhService.xoaKhoiDanhSachKhongDangKy(maHoatDong, maSv);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa", null));
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
